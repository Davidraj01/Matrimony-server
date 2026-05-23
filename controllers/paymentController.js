import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js";
import Billing from "../models/Billing.js";

// ==============================
// CREATE ORDER
// ==============================
export const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const amount = 100; // ₹100 test

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    // ✅ SAVE BILLING ENTRY (IMPORTANT)
    await Billing.create({
      account: req.user._id,
      orderRef: order.id,
      amount: amount,
      planType: "premium",
      status: "created",
    });

    res.json(order);
  } catch (err) {
    console.log("ORDER ERROR:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

// ==============================
// VERIFY PAYMENT
// ==============================
export const verifyPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest("hex");
    console.log("EXPECTED:", expected);
    console.log("RECEIVED:", razorpay_signature);
    // ❌ INVALID PAYMENT
    if (expected !== razorpay_signature) {
      await Billing.findOneAndUpdate(
        { orderRef: razorpay_order_id },
        { status: "failed" },
      );

      return res.status(400).json({ message: "Invalid payment" });
    }

    // ==========================
    // ✅ UPDATE USER
    // ==========================
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscription: "premium",
        isPremium: true,
        premiumExpires: expiry,
        viewsCount: 30,
      },
      { new: true },
    );

    // ==========================
    // ✅ UPDATE BILLING
    // ==========================
    const bill = await Billing.findOne({ orderRef: razorpay_order_id });

    if (!bill) {
      console.log("❌ Billing not found for:", razorpay_order_id);
    } else {
      bill.paymentRef = razorpay_payment_id;
      bill.status = "success";
      await bill.save();
    }

    res.json({
      success: true,
      subscription: updatedUser.subscription,
      expires: updatedUser.premiumExpires,
    });
  } catch (err) {
    console.log("VERIFY ERROR:", err);

    if (req.body?.razorpay_order_id) {
      await Billing.findOneAndUpdate(
        { orderRef: req.body.razorpay_order_id },
        { status: "failed" },
      );
    }

    res.status(500).json({ message: "Verification failed" });
  }
};

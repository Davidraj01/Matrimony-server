import axios from "axios";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// =========================================
// 🔢 GENERATE OTP
// =========================================
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// =========================================
// 📩 SEND OTP
// =========================================
export const sendOTP = async (req, res) => {
  try {
    let { phone } = req.body;

    // ✅ VALIDATION
    if (!phone) {
      return res.status(400).json({
        message: "Phone number required",
      });
    }

    // ✅ NORMALIZE PHONE
    phone = phone.replace(/\D/g, "").slice(-10);

    // ✅ FIND USER
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please register first.",
      });
    }

    // ✅ ALREADY VERIFIED
    if (user.isPhoneVerified) {
      return res.status(400).json({
        message: "Phone already verified",
      });
    }

    // ✅ COOLDOWN (30s)
    if (
      user.lastOtpSent &&
      Date.now() - new Date(user.lastOtpSent).getTime() < 30000
    ) {
      return res.status(400).json({
        message: "Wait 30 seconds before requesting again",
      });
    }

    // =========================================
    // 🔢 GENERATE OTP
    // =========================================
    const otp = generateOTP();

    console.log("GENERATED OTP:", otp);

    // =========================================
    // 🧪 DEVELOPMENT MODE
    // =========================================
    if (process.env.NODE_ENV === "development") {
      // ✅ SAVE OTP
      user.otp = await bcrypt.hash(otp, 10);

      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      user.lastOtpSent = new Date();

      await user.save();

      console.log("🧪 TEST OTP:", otp);

      return res.json({
        message: "OTP generated (development mode)",
      });
    }

    // =========================================
    // 📲 SEND SMS (PRODUCTION)
    // =========================================
    const smsRes = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your OTP is ${otp}`,
        language: "english",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("FAST2SMS RESPONSE:", smsRes.data);
    // ✅ SMS FAILED
    if (!smsRes.data.return) {
      return res.status(500).json({
        message: "SMS sending failed",
        error: smsRes.data.message || "Unknown Fast2SMS error",
      });
    }

    // =========================================
    // ✅ SAVE OTP ONLY AFTER SMS SUCCESS
    // =========================================
    user.otp = await bcrypt.hash(otp, 10);

    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.lastOtpSent = new Date();

    await user.save();

    // ✅ SUCCESS
    res.json({
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("SEND OTP ERROR:", err.response?.data || err.message);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

// =========================================
// ✅ VERIFY OTP
// =========================================
export const verifyOTP = async (req, res) => {
  try {
    let { phone, otp } = req.body;

    // ✅ VALIDATION
    if (!phone || !otp) {
      return res.status(400).json({
        message: "Phone and OTP required",
      });
    }

    // ✅ NORMALIZE PHONE
    phone = phone.replace(/\D/g, "").slice(-10);

    // ✅ FIND USER
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ✅ NO OTP
    if (!user.otp) {
      return res.status(400).json({
        message: "No OTP requested",
      });
    }

    // ✅ EXPIRED
    if (!user.otpExpires || new Date(user.otpExpires).getTime() < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    // ✅ VERIFY OTP
    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // =========================================
    // ✅ VERIFIED
    // =========================================
    user.isPhoneVerified = true;

    // 🔥 CLEAR OTP DATA
    user.otp = null;
    user.otpExpires = null;
    user.lastOtpSent = null;

    await user.save();

    res.json({
      message: "Phone verified successfully",
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err.message);

    res.status(500).json({
      message: "Verification failed",
    });
  }
};

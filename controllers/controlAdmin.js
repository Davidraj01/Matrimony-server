// controllers/controlAdmin.js
import User from "../models/User.js";
import Billing from "../models/Billing.js";

// ALL USERS
export const fetchAllUsers = async (req, res) => {
  const data = await User.find().sort({ createdAt: -1 });
  res.json(data);
};

// BLOCK
export const disableUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
  res.json({ message: "User blocked" });
};

// UNBLOCK
export const enableUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
  res.json({ message: "User unblocked" });
};

// USER DETAILS
export const fetchUserFull = async (req, res) => {
  const user = await User.findById(req.params.id);
  const billing = await Billing.find({ account: user._id });

  res.json({
    ...user._doc,
    billing,
  });
};

// BILLING LIST
export const fetchBilling = async (req, res) => {
  const list = await Billing.find()
    .populate("account", "name")
    .sort({ createdAt: -1 });

  res.json(
    list.map((b) => ({
      _id: b._id,
      userName: b.account?.name,
      paymentId: b.paymentRef,
      orderId: b.orderRef,
      amount: b.amount,
      plan: b.planType,
      status: b.status,
      createdAt: b.createdAt,
    })),
  );
};

// DASHBOARD
export const fetchDashboard = async (req, res) => {
  const totalUsers = await User.countDocuments();

  const revenue = await Billing.aggregate([
    { $match: { status: "success" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  res.json({
    users: totalUsers,
    revenue: revenue[0]?.total || 0,
  });
};

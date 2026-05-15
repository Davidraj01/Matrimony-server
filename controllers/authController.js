import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Profile from "../models/Profile.js";
import Counter from "../models/Counter.js";
export const register = async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const { name, email, password, gender, location } = req.body;
    let phone = req.body.phone || req.body.mobile;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    phone = phone.replace(/\D/g, "").slice(-10);

    const exists = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (exists) {
      return res.status(400).json({ message: "User exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ UNIQUE ID GENERATOR (INSIDE FUNCTION)
    const counter = await Counter.findOneAndUpdate(
      { name: "matrimonyUserId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const userUniqueId = "RM" + String(counter.seq).padStart(6, "0");
    // ✅ CREATE USER (UPDATED)
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      userUniqueId, // ⭐ ADDED
    });

    // ✅ PROFILE
    await Profile.create({
      userId: user._id,
      name: user.name,
      gender: gender?.trim().toLowerCase(),
      location: location?.trim().toLowerCase(),
    });

    res.json({
      message: "Registered successfully",
      userUniqueId: user.userUniqueId, // optional return
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({
      message: "Wrong password",
    });
  }

  // ✅ Generate Matrimony ID if missing
  if (!user.userUniqueId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "matrimonyUserId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    user.userUniqueId = "RM" + String(counter.seq).padStart(6, "0");

    await user.save();
  }
  // ✅ REFRESH USER FROM DB
  user = await User.findById(user._id);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      subscription: user.subscription,
      isPremium: user.isPremium,
      isPhoneVerified: user.isPhoneVerified,
      userUniqueId: user.userUniqueId,
    },
  });
};

//reset password
export const resetPassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password required",
      });
    }

    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

    const user = await User.findOne({
      phone: normalizedPhone,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;

    await user.save();

    res.json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);

    res.status(500).json({
      message: "Password reset failed",
    });
  }
};

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userUniqueId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ PLAN TYPE
    subscription: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    // ✅ PAYMENT STATUS
    isPremium: {
      type: Boolean,
      default: false,
    },

    // ✅ EXPIRY DATE
    premiumExpires: {
      type: Date,
      default: null,
    },

    // ✅ OPTIONAL (for analytics)
    viewsCount: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    otp: String,
    otpExpires: Date,
    lastOtpSent: Date,
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    shortlistedProfiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);

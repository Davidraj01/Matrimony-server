import User from "../models/User.js";

export const checkPremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.subscription !== "premium") {
      return res.status(403).json({
        message: "Upgrade to premium to use chat",
      });
    }

    next();
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

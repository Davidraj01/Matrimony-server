import User from "../models/User.js";

//  GET ALL PLANS
export const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        name: "free",
        price: 0,
        features: ["View profiles", "Send interests", "Limited access"],
      },
      {
        name: "premium",
        price: 100,
        features: [
          "Unlimited interests",
          "Chat unlocked",
          "View contact details",
        ],
      },
    ];

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch plans" });
  }
};

//  GET CURRENT USER PLAN
export const getMyPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    //  auto-expiry check
    if (
      user.isPremium &&
      user.premiumExpires &&
      new Date() > user.premiumExpires
    ) {
      user.isPremium = false;
      user.subscription = "free";
      user.premiumExpires = null;
      await user.save();
    }

    res.json({
      subscription: user.subscription,
      isPremium: user.isPremium,
      premiumExpires: user.premiumExpires,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch plan" });
  }
};

//  UPGRADE TO PREMIUM
export const upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (plan !== "premium") {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await User.findById(req.user._id);

    //  set premium for 30 days
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    user.subscription = "premium";
    user.isPremium = true;
    user.premiumExpires = expiry;

    await user.save();

    res.json({
      message: "Upgraded to premium 🎉",
      premiumExpires: expiry,
    });
  } catch (err) {
    res.status(500).json({ message: "Upgrade failed" });
  }
};

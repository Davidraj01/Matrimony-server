import User from "../models/User.js";

export const toggleShortlist = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.shortlistedProfiles = user.shortlistedProfiles || [];

    const index = user.shortlistedProfiles.findIndex(
      (id) => id.toString() === targetUserId,
    );

    let action;

    if (index > -1) {
      // ❌ remove
      user.shortlistedProfiles.splice(index, 1);
      action = "removed";
    } else {
      // ✅ add
      user.shortlistedProfiles.push(targetUserId);
      action = "added";
    }

    await user.save();

    res.json({
      message: `Shortlist ${action}`,
      shortlistedProfiles: user.shortlistedProfiles,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getShortlisted = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "shortlistedProfiles",
      "name userUniqueId",
    );

    res.json(user.shortlistedProfiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

import ProfileView from "../models/ProfileView.js";
export const getMyViewers = async (req, res) => {
  try {
    const views = await ProfileView.find({ viewed: req.user._id })
      .populate("viewer", "name userUniqueId profilePic")
      .sort({ createdAt: -1 });

    res.json(views);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

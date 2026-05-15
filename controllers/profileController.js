import Profile from "../models/Profile.js";
import User from "../models/User.js";
import ProfileView from "../models/ProfileView.js";
//
// 🔢 CALCULATE COMPLETION
//
const calculateCompletion = (profile) => {
  const fields = [
    profile.name,
    profile.age,
    profile.location,
    profile.education,
    profile.job,
    profile.bio,
    profile.religion,
    profile.height,
    profile.maritalStatus,
  ];

  const filled = fields.filter((f) => f).length;
  return Math.round((filled / fields.length) * 100);
};

//
// 📄 GET PROFILE
//
export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user.id }).populate(
      "userId",
      "name email subscription premiumExpires userUniqueId",
    );

    if (!profile) {
      const newProfile = await Profile.create({
        userId: req.user.id,
      });

      profile = await Profile.findById(newProfile._id).populate(
        "userId",
        "name email subscription premiumExpires userUniqueId",
      );
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params; // ✅ FIRST

    // ⭐ STORE VIEW (avoid self-view)
    if (req.user._id.toString() !== id.toString()) {
      await ProfileView.findOneAndUpdate(
        { viewer: req.user._id, viewed: id },
        { $set: { createdAt: new Date() } },
        { upsert: true },
      );
    }

    const profile = await Profile.findOne({ userId: id }).populate(
      "userId",
      "name email subscription premiumExpires phone userUniqueId",
    );

    console.log(profile);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const currentUser = await User.findById(req.user._id);

    const isPremium =
      currentUser?.subscription === "premium" &&
      currentUser?.premiumExpires &&
      new Date(currentUser.premiumExpires) > new Date();

    console.log("IS PREMIUM:", isPremium);
    console.log("USER PHONE:", profile.userId?.phone);

    const response = {
      ...profile.toObject(),
      phone: isPremium ? profile.userId?.phone : null,
    };

    res.json(response);
  } catch (err) {
    console.log("GET PROFILE BY ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✏️ UPDATE PROFILE
//
export const updateProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      profile = new Profile({ userId: req.user.id });
    }

    const allowed = [
      "name",
      "age",
      "gender",
      "height",
      "religion",
      "caste",
      "phone",
      "location",
      "education",
      "job",
      "income",
      "bio",

      "diet",
      "smoke",
      "drink",

      "father",
      "mother",
      "siblings",
      "familyType",
      "familyStatus",

      "motherTongue",
      "maritalStatus",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // ✅ preferences
    if (req.body.preferences) {
      const pref = req.body.preferences;

      profile.preferences = profile.preferences || {};

      if (pref.location !== undefined)
        profile.preferences.location = pref.location;

      if (pref.religion !== undefined)
        profile.preferences.religion = pref.religion;

      if (pref.education !== undefined)
        profile.preferences.education = pref.education;

      if (pref.height !== undefined) profile.preferences.height = pref.height;

      // 🔥 IMPORTANT (nested)
      if (pref.ageRange) {
        profile.preferences.ageRange = {
          ...(profile.preferences.ageRange || {}),
          ...pref.ageRange,
        };
      }
    }

    // ✅ INTERESTS
    if (req.body.interests) {
      profile.interests = req.body.interests;
    }

    profile.profileCompleted = calculateCompletion(profile);

    await profile.save();

    const updated = await Profile.findOne({ userId: req.user.id }).populate(
      "userId",
      "name email subscription premiumExpires userUniqueId",
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

// 📸 UPLOAD PHOTOS
//
export const uploadPhotos = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user.id }).populate(
      "userId",
    );

    const urls = req.files.map((file) => `/${file.path}`);

    // ✅ MAX 4 IMAGES
    const existingPhotos = profile.photos || [];

    if (existingPhotos.length + urls.length > 4) {
      return res.status(400).json({
        msg: "Maximum 4 photos allowed",
      });
    }

    profile.photos.push(...urls);

    await profile.save();

    res.json(profile);
  } catch (err) {
    res.status(500).json({ msg: "Upload failed" });
  }
};

//
// ❌ DELETE PHOTO
//
export const deletePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;

    const profile = await Profile.findOne({ userId: req.user.id });

    profile.photos = profile.photos.filter((p) => p !== photoUrl);

    await profile.save();

    res.json(profile);
  } catch {
    res.status(500).json({ msg: "Delete failed" });
  }
};

//
// ⭐ SET PROFILE PIC
//
export const setProfilePic = async (req, res) => {
  try {
    const { photoUrl } = req.body;

    const profile = await Profile.findOne({ userId: req.user.id });

    profile.profilePic = photoUrl;

    await profile.save();

    res.json(profile);
  } catch {
    res.status(500).json({ msg: "Failed to set profile pic" });
  }
};

export const viewProfile = async (req, res) => {
  try {
    console.log("VIEW BODY:", req.body); // 🔍 debug

    const targetUserId = req.body.targetUserId || req.body.userId;

    if (!targetUserId) {
      return res.status(400).json({ message: "UserId required" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❌ no views left
    if (user.viewsCount <= 0) {
      return res.status(403).json({
        message: "No profile views left 💎",
      });
    }

    user.viewedProfiles = user.viewedProfiles || [];

    // ✅ prevent double deduction
    if (user.viewedProfiles.includes(targetUserId)) {
      return res.json({ viewsLeft: user.viewsCount });
    }

    user.viewsCount -= 1;
    user.viewedProfiles.push(targetUserId);

    await user.save();

    res.json({ viewsLeft: user.viewsCount });
  } catch (err) {
    console.error("VIEW PROFILE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

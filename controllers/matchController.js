import mongoose from "mongoose";
import Profile from "../models/Profile.js";
import Interest from "../models/Interest.js";

export const getMatches = async (req, res) => {
  try {
    console.log("QUERY PARAMS:", req.query);
    console.log("USER DATA:", req.user);

    const filter = {};

    // ✅ EXCLUDE SELF
    if (req.user?._id) {
      filter.userId = {
        $ne: new mongoose.Types.ObjectId(req.user._id),
      };
    }

    const {
      minAge,
      maxAge,
      location,
      religion,
      caste,
      education,
      job,
      gender,
      diet,
      maritalStatus,
      motherTongue,
    } = req.query;

    // ========================================
    // 🔥 USE PREFERENCES IF FILTERS EMPTY
    // ========================================
    const userProfile = await Profile.findOne({
      userId: req.user._id,
    }).lean();

    const pref = userProfile?.preferences || {};

    const usePref = Object.keys(req.query).length === 0;

    // fallback values
    const finalMinAge = usePref ? pref.ageRange?.min : minAge;
    const finalMaxAge = usePref ? pref.ageRange?.max : maxAge;
    const finalLocation = usePref ? pref.location : location;
    const finalReligion = usePref ? pref.religion : religion;
    const finalEducation = usePref ? pref.education : education;
    const finalJob = usePref ? pref.job : job;
    const finalDiet = usePref ? pref.diet : diet;
    const finalMarital = usePref ? pref.maritalStatus : maritalStatus;
    const finalMotherTongue = usePref ? pref.motherTongue : motherTongue;
    const finalCaste = usePref ? pref.caste : caste;
    const finalGender = usePref ? pref.gender : gender;
    // ✅ SAFE REGEX ESCAPE
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // ✅ FLEXIBLE SEARCH
    const containsCI = (value) => ({
      $regex: escapeRegex(value.trim()),
      $options: "i",
    });

    // ✅ AGE
    if (
      finalMinAge &&
      finalMaxAge &&
      !isNaN(finalMinAge) &&
      !isNaN(finalMaxAge)
    ) {
      filter.age = {
        $gte: Number(finalMinAge),
        $lte: Number(finalMaxAge),
      };
    }

    // ✅ TEXT FILTERS
    if (finalLocation?.trim()) filter.location = containsCI(finalLocation);
    if (finalJob?.trim()) filter.job = containsCI(finalJob);
    if (finalMotherTongue?.trim())
      filter.motherTongue = containsCI(finalMotherTongue);

    if (finalReligion?.trim()) filter.religion = containsCI(finalReligion);
    if (finalCaste?.trim()) filter.caste = containsCI(finalCaste);
    if (finalEducation?.trim()) filter.education = containsCI(finalEducation);

    // ✅ GENDER
    if (finalGender?.trim()) {
      filter.gender = {
        $regex: `^${escapeRegex(finalGender.trim())}$`,
        $options: "i",
      };
    }

    // ✅ OTHER
    if (finalDiet?.trim()) filter.diet = containsCI(finalDiet);
    if (finalMarital?.trim()) filter.maritalStatus = containsCI(finalMarital);

    console.log("FINAL FILTER:", JSON.stringify(filter, null, 2));

    // =====================================================
    // ✅ PREMIUM LOGIC (EXPIRY BASED)
    // =====================================================
    const isPremium =
      req.user?.subscription === "premium" &&
      req.user?.premiumExpires &&
      new Date(req.user.premiumExpires) > new Date();

    const FREE_LIMIT = 4;
    const PREMIUM_LIMIT = 30;

    const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;

    console.log("IsPremium:", isPremium, "| Limit:", limit);

    // =====================================================
    // ✅ FETCH MATCHES
    // =====================================================
    const matches = await Profile.find(filter)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(`Found ${matches.length} matches`);

    // =====================================================
    // ✅ FETCH INTERESTS
    // =====================================================
    const interests = await Interest.find({
      sender: req.user._id,
    }).lean();

    const sentIds = new Set(interests.map((i) => i.receiver.toString()));

    // =====================================================
    // ✅ FINAL RESULT
    // =====================================================
    const result = matches.map((m) => ({
      ...m,
      isInterestSent: sentIds.has(m.userId?._id?.toString()),
    }));

    res.json({
      profiles: result,
      isPremium,
      expiresAt: req.user?.premiumExpires || null,
    });
  } catch (err) {
    console.error("MATCH ERROR FULL:", err);
    res.status(500).json({
      message: err.message || "Error fetching matches",
    });
  }
};

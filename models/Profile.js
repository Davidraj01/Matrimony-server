import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // BASIC
    name: String,
    age: Number,
    gender: String,
    height: String,
    religion: String,
    caste: String,
    phone: Number,
    location: String,
    education: String,
    job: String,
    income: String,
    bio: String,

    // LIFESTYLE
    diet: String,
    smoke: Boolean,
    drink: Boolean,

    // FAMILY ✅ NEW
    father: String,
    mother: String,
    siblings: String,
    familyType: String,
    familyStatus: String,

    // EXTRA
    motherTongue: String,
    maritalStatus: String,

    // MATCH PREFERENCES ✅ NEW
    preferences: {
      ageRange: {
        min: Number,
        max: Number,
      },

      height: String,
      education: String,
      location: String,
      religion: String,

      // 🔹 PERSONAL
      maritalStatus: String,
      motherTongue: String,

      // 🔹 PROFESSIONAL
      job: String,
      income: String,

      // 🔹 LIFESTYLE
      diet: String,
      smoke: Boolean,
      drink: Boolean,

      // 🔹 FAMILY
      familyStatus: String,
      familyType: String,

      // 🔹 FLEXIBILITY
      willingToRelocate: Boolean,

      // 🔹 FILTERS
      profileWithPhoto: Boolean,
    },

    // STATUS
    isOnline: {
      type: Boolean,
      default: false,
    },

    // MEDIA
    profilePic: {
      type: String,
      default: "",
    },

    photos: {
      type: [String],
      default: [],
    },

    interests: {
      type: [String],
      default: [],
    },

    profileCompleted: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Profile", profileSchema);

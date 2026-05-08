// models/Billing.js
import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    orderRef: String,
    paymentRef: String,

    amount: Number,
    planType: String,

    status: {
      type: String,
      enum: ["created", "success", "failed"],
      default: "created",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Billing", billingSchema);

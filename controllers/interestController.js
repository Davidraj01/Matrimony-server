import mongoose from "mongoose";
import Interest from "../models/Interest.js";

export const sendInterest = async (req, res) => {
  try {
    const sender = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver required" });
    }

    if (sender.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot send to yourself" });
    }

    // 🔥 Check if already sent
    const existing = await Interest.findOne({
      sender,
      receiver: receiverId,
    });

    if (existing) {
      return res.json({ alreadySent: true });
    }

    // 🔥 CHECK REVERSE (IMPORTANT)
    const reverse = await Interest.findOne({
      sender: receiverId,
      receiver: sender,
    });

    if (reverse) {
      reverse.status = "accepted";
      await reverse.save();

      const newInterest = await Interest.create({
        sender,
        receiver: receiverId,
        status: "accepted",
      });

      return res.json(newInterest);
    }
  } catch (err) {
    console.error("SEND ERROR:", err);
    res.status(500).json({ message: "Failed to send interest" });
  }
};

export const getReceivedInterests = async (req, res) => {
  try {
    const interests = await Interest.find({
      receiver: req.user._id,
    })
      .populate("sender", "name")
      .sort({ createdAt: -1 }) // 🔥 newest first
      .lean();

    res.json(interests);
  } catch (err) {
    console.error("RECEIVED ERROR:", err);
    res.status(500).json({ message: "Error fetching interests" });
  }
};

export const getSentInterests = async (req, res) => {
  try {
    const data = await Interest.find({
      sender: req.user._id,
    })
      .populate("receiver", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(data);
  } catch (err) {
    console.error("SENT ERROR:", err);
    res.status(500).json({ message: "Error fetching sent interests" });
  }
};

export const respondInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const interest = await Interest.findById(id);

    if (!interest) {
      return res.status(404).json({ message: "Interest not found" });
    }

    // SECURITY: only receiver can respond
    if (interest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    interest.status = status;
    await interest.save();

    res.json({ message: "Updated", status });
  } catch (err) {
    console.error("RESPOND ERROR:", err);
    res.status(500).json({ message: "Error updating" });
  }
};

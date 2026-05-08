import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

//  LOAD ENV
dotenv.config();

//  IMPORT MODELS
import Message from "./models/message.js";

//  IMPORT ROUTES
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import interestRoutes from "./routes/interestRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import routeAdmin from "./routes/routeAdmin.js";
import viewRoutes from "./routes/viewRoutes.js";
import shortlistRoutes from "./routes/shortlistRoutes.js";

//  CREATE APP + SERVER
const app = express();
const server = http.createServer(app);

//  MIDDLEWARE
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

//  SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ JOIN
  socket.on("join", (userId) => {
    socket.userId = userId.toString();

    console.log("✅ JOINED:", socket.id, socket.userId);

    onlineUsers[socket.userId] = socket.id;
  });
  // ✅ SEND MESSAGE
  socket.on("sendMessage", async (data) => {
    console.log("📥 socket.id:", socket.id);
    console.log("📥 socket.userId:", socket.userId);

    const { receiver, text } = data;
    const sender = socket.userId;

    if (!sender) {
      console.log("🚨 sender missing — WRONG SOCKET");
      return;
    }

    const message = await Message.create({
      sender,
      receiver,
      text,
    });

    io.to(onlineUsers[receiver]).emit("receiveMessage", message);
    io.to(onlineUsers[sender]).emit("receiveMessage", message);
  });
  socket.on("disconnect", () => {
    if (socket.userId) {
      delete onlineUsers[socket.userId];
    }
    console.log("User disconnected");
  });
});

//  TEST ROUTE
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/match", matchRoutes);
app.use("/api/interest", interestRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/views", viewRoutes);
app.use("/api/admin", routeAdmin);
app.use("/api/shortlist", shortlistRoutes);
//  CONNECT DB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

//  START SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

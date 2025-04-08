const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const ChatModel = require("../models/ChatModel");
const { TokenDecode, TokenVerification } = require("../utils/defaultFunction");
const UserModel = require("../models/UserModel");

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(token, "<<<<<<<<<<<<<<<< Token in Socket >>>>>>>>>>>>>>>>");
    try {
      if (!token) return next(new Error("Authentication error"));

      let decode = TokenDecode(token);

      console.log(decode, "Line 22 ChatController");

      let user = await UserModel.findOne({ hash: decode?.id });

      console.log(user.jwtSecret, "JWT code");

      if (!user) return next(new Error("Authentication error"));

      try {
        const decoded = jwt.verify(token, user.jwtSecret);
        console.log("Socket authenticated");
        socket.user = user;
        next();
      } catch (err) {
        next(new Error("Unauthorized"));
      }
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.user.name);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`${socket.user.name} joined ${roomId}`, "line 48");
    });

    socket.on("sendMessage", async ({ roomId, message }) => {
      console.log(socket.user, "Send Messages");
      console.log(message, roomId, "line 53");

      const newMessage = new ChatModel({
        dealId: roomId,
        senderId: socket.user.id,
        senderName: socket.user.name,
        readBy: socket.user.name,
        text: message,
      });

      await newMessage.save();

      io.to(roomId).emit("receiveMessage", {
        text: message,
        senderName: socket.user.name,
        senderId: socket.user.id,
        isSender: false,
      });

      io.to(roomId).emit("newNotification", {
        from: socket.user.name,
        text: message,
      });
    });
  });
};

const ChatHistory = async (req, res) => {
  try {
    console.log(req.params);
    const messages = await ChatModel.find({ dealId: req.params.roomId }).sort(
      "createdAt"
    );
    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Failed to fetch messages" });
  }
};

module.exports = { setupSocket, ChatHistory };

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/authRoute");
const dealRouter = require("./routes/dealRoute");
const chatRouter = require("./routes/chatRoute");
const paymentRouter = require("./routes/paymentRoute");
const http = require("http");
const {setupSocket} = require("./controllers/chatController");
const redisClient = require("./config/redis");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(cors());

redisClient;

// const limiter = rateLimit({
// 	windowMs: 1 * 60 * 1000,
// 	limit: 10, 
// 	standardHeaders: 'draft-8', 
// 	legacyHeaders: false, 
// });

// app.use(limiter)


app.use("/api/v1", authRouter);
app.use("/api/v1", dealRouter);
app.use("/api/v1", chatRouter);
app.use("/api/v1", paymentRouter);

setupSocket(server);

app.get("/", (req, res) => {
  res.send("Welcome to Virtual Deal Room API");
});

const port = process.env.PORT;
server.listen(port, () =>
  console.log(`Server running on port http://localhost:${port}`)
);

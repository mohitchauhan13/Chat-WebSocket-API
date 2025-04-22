const express = require("express");
const https = require("https");
const fs = require("fs");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");
const Message = require("./models/Message");

const app = express();

// Load SSL cert and key
const options = {
  key: fs.readFileSync("/etc/ssl/private/selfsigned.key"),
  cert: fs.readFileSync("/etc/ssl/certs/selfsigned.crt"),
};

// Create HTTPS server
const server = https.createServer(options, app);

// Attach WebSocket server
const wss = new WebSocket.Server({ server });

// Allow Amplify frontend and optionally localhost for dev
app.use(
  cors({
    origin: [
      `https://${process.env.AMPLIFY_APP_ID}.amplifyapp.com`,
      `https://${process.env.EC2_DOMAIN}`,
      "http://localhost:3000",
    ],
  })
);

app.use(express.json());

// MongoDB connection
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.czk4vgq.mongodb.net/chatapp?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// REST API
app.get("/messages", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 }).limit(20);
  res.json(messages);
});

// WebSocket logic
wss.on("connection", (ws) => {
  ws.on("message", async (data) => {
    const msg = JSON.parse(data);
    const saved = await Message.create({
      username: msg.username,
      text: msg.text,
    });
    const payload = JSON.stringify(saved);

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });
});

// Start HTTPS server
const PORT = 443;
server.listen(PORT, () => {
  const domain = process.env.EC2_DOMAIN || "localhost";
  console.log(`🚀 Server running at: https://${domain}:${PORT}`);
});

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/chatapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/messages", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 }).limit(20);
  res.json(messages);
});

wss.on("connection", (ws) => {
  ws.on("message", async (data) => {
    const msg = JSON.parse(data);
    const saved = await Message.create({
      username: msg.username,
      text: msg.text,
    });
    const payload = JSON.stringify(saved);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });
});

server.listen(4000, () => {
  console.log("Server listening on http://localhost:4000");
});

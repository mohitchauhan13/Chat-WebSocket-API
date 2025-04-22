const express = require("express");
const https = require("https");
const fs = require("fs");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");
const Message = require("./models/Message");

const app = express();

const options = {
  key: fs.readFileSync("/etc/ssl/private/selfsigned.key"), // Use the path to your private key
  cert: fs.readFileSync("/etc/ssl/certs/selfsigned.crt"), // Use the path to your certificate
};

const server = https.createServer(options, app);

const wss = new WebSocket.Server({ server });

app.use(
  cors({
    origin: `https://${process.env.AMPLIFY_APP_ID}.amplifyapp.com`, // Set the Amplify URL
  })
);

app.use(express.json());

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.czk4vgq.mongodb.net//chatapp?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Successfully connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
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

server.listen(443, () => {
  console.log("Server listening on https://localhost:443");
});

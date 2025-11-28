import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Memory store for last 10 alerts
let crashHistory = [];

// Your Zoho channel webhook
const WEBHOOK_URL = "https://cliq.zoho.in/api/v2/bots/firebasecrashlytics/message?zapikey=1001.aa68769fa1309d6a65cf9950486e8a86.ee4b3395450c6881c54ce4b392a3850d";

// -----------------------------
// RECEIVE FIREBASE ALERTS HERE
// -----------------------------
app.post("/", async (req, res) => {
  console.log("Received Crashlytics event:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    // Push alert to memory
    crashHistory.unshift(req.body);
    crashHistory = crashHistory.slice(0, 10); // keep last 10 alerts

    // Prepare message for Zoho
    const issue = req.body.payload?.issue;
    const msgText =
      "**🔥 Crashlytics Alert**\n\n" +
      `**Issue:** ${issue?.title || "Unknown"}\n\n` +
      `**Subtitle:** ${issue?.subtitle || "None"}\n\n` +
      `**App Version:** ${issue?.appVersion || "N/A"}`;

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msgText }),
    });

    res.status(200).send("OK");
  } catch (err) {
    console.error("Error handling alert:", err);
    res.status(500).send("Error");
  }
});

// -----------------------------
// GET LATEST ALERTS
// -----------------------------
app.get("/api/latest", (req, res) => {
  res.json({ items: crashHistory });
});

// -----------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Crashlytics forwarder running on port ${PORT}`);
});

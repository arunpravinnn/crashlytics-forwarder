import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Memory store for last 10 alerts
let crashHistory = [];

// Your Zoho channel webhook
const WEBHOOK_URL =
  "https://cliq.zoho.in/api/v2/bots/firebasecrashlytics/message?zapikey=1001.aa68769fa1309d6a65cf9950486e8a86.ee4b3395450c6881c54ce4b392a3850d";

// --------------------------------------------------
// RECEIVE FIREBASE ALERTS (EventArc ➝ Cloud Run)
// --------------------------------------------------
app.post("/", async (req, res) => {
  console.log("Received Crashlytics event:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    // Store alert in memory (keep last 10)
    crashHistory.unshift(req.body);
    crashHistory = crashHistory.slice(0, 10);

    // Extract issue data
    const issue = req.body.payload?.issue;

    const msgText =
      "*🔥 Crashlytics Alert*\n\n" +
      `*Issue:* ${issue?.title || "Unknown"}\n\n` +
      `*Subtitle:* ${issue?.subtitle || "None"}\n\n` +
      `*App Version:* ${issue?.appVersion || "N/A"}\n\n` +
      `*Issue ID:* \`${issue?.id || "N/A"}\``;

    // Send to Zoho
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

// --------------------------------------------------
// GET LATEST ALERTS
// --------------------------------------------------
app.get("/api/latest", (req, res) => {
  res.json({ items: crashHistory });
});

// --------------------------------------------------
// GET SINGLE ISSUE BY ID
// --------------------------------------------------
app.get("/api/issue/:id", (req, res) => {
  const issueId = req.params.id;

  // Search for the issue inside crashHistory
  let foundIssue = null;

  for (const entry of crashHistory) {
    const issue = entry.payload?.issue;
    if (issue && issue.id === issueId) {
      foundIssue = issue;
      break;
    }
  }

  if (!foundIssue) {
    return res.json({
      error: "Issue not found.",
      formatted_text: "Issue ID not found in recent crash history.",
    });
  }

  // Format response for slash command
  const formatted =
    `🔥 *Crashlytics Issue Details*\n\n` +
    `*Title:* ${foundIssue.title}\n` +
    `*Subtile:* ${foundIssue.subtitle}\n` +
    `*Version:* ${foundIssue.appVersion}\n` +
    `*Issue ID:* \`${foundIssue.id}\`\n`;

  res.json({
    issue: foundIssue,
    formatted_text: formatted,
  });
});

// --------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Crashlytics forwarder running on port ${PORT}`);
});

import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const WEBHOOK_URL = "YOUR_CLIQ_WEBHOOK_URL_HERE";

app.post("/", async (req, res) => {
  console.log("Received Crashlytics event:");
  console.log(JSON.stringify(req.body, null, 2));

  const payload = req.body;

  const message = {
    text:
      "**Crashlytics Alert**\n\n" +
      "App: " + (payload.appId || "Unknown App") + "\n" +
      "Issue: " + (payload.issue?.title || "Crash Detected!") + "\n" +
      "Level: " + (payload.issue?.level || "N/A") + "\n" +
      "New Issue: " + (payload.issue?.isNewIssue ? "Yes" : "No"),
  };

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  res.status(200).send("OK");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Crashlytics forwarder running on port ${PORT}`);
});

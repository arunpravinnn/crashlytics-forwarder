import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());


const WEBHOOK_URL =
  "https://cliq.zoho.in/api/v2/bots/firebasecrashlytics/message?zapikey=1001.aa68769fa1309d6a65cf9950486e8a86.ee4b3395450c6881c54ce4b392a3850d";

app.post("/", async (req, res) => {
  console.log("Received Crashlytics event:");
  console.log(JSON.stringify(req.body, null, 2));

  const payload = req.body.payload?.issue;

  const message = {
    text:
      "**🔥 Crashlytics Alert**\n\n" +
      "**Issue:** " + (payload?.title ?? "Unknown title") + "\n" +
      "**Subtitle:** " + (payload?.subtitle ?? "") + "\n" +
      "**App Version:** " + (payload?.appVersion ?? "N/A") + "\n" +
      "**New Issue:** " + (payload?.isNewIssue ? "Yes" : "No"),
  };

  console.log("Sending to Cliq bot...");

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  const text = await response.text();
  console.log("Cliq response:", response.status, text);

  res.status(200).send("OK");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Crashlytics forwarder running on port ${PORT}`);
});


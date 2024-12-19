const MailListener = require("mail-listener2");
const axios = require("axios");
require("dotenv").config();

if (!process.env.HOST || !process.env.PORT || !process.env.USER || !process.env.PASSWORD || !process.env.WEBHOOK_URL) {
  console.error("Error: Make sure all required environment variables are set.");
  process.exit(1);
}

console.log(`Connecting to ${process.env.HOST}:${process.env.PORT} as ${process.env.USER}`);

const mailListener = new MailListener({
  username: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  port: process.env.PORT,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX",
  markSeen: true,
  fetchUnreadOnStart: true,
  attachments: true,
  attachmentOptions: { directory: "attachments/" },
});

async function sendWebhook(data) {
  try {
    await axios.post(process.env.WEBHOOK_URL, {
      username: data.from,
      content: `@everyone`,
      embeds: [
        {
          title: data.subject,
          description: data.text,
          color: 0xffffff,
        },
      ],
    });
    console.log("Webhook successfully sent.");
  } catch (error) {
    console.error("Error sending webhook:", error.message);
  }
}

mailListener.start();

mailListener.on("server:connected", () => {
  console.log("Connected to the email server.");
});

mailListener.on("server:disconnected", () => {
  console.log("Disconnected from the email server.");
});

mailListener.on("error", (err) => {
  console.error("MailListener error:", err.message);
});

mailListener.on("mail", (mail) => {
  console.log("New email received.");

  const data = {
    from: mail.from[0].address,
    subject: mail.subject,
    text: mail.text,
  };

  sendWebhook(data);
});

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const { translate } = require("@vitalets/google-translate-api");

// Example proxy URL (replace with your own)
const proxy = process.env.PROXY_URL || "http://103.152.112.162:80";

const { HttpProxyAgent } = require("http-proxy-agent");

const agent = new HttpProxyAgent("http://103.152.112.162:80");

const app = express();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ----------- Security Middlewares ------------
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(hpp());
app.use(compression());
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ----------- Routes ------------

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Secure Express API is running 🚀" });
});

/**
 * Translate API
 * Input:
 * {
 *   "data": { "name": "name of something", "description": "description of something" },
 *   "to": ["ar", "fr", "tr"]
 * }
 *
 * Output:
 * {
 *   "ar": { "name": "اسم شيء ما", "description": "وصف شيء ما" },
 *   "fr": { "name": "nom de quelque chose", "description": "description de quelque chose" },
 *   "tr": { "name": "bir şeyin adı", "description": "bir şeyin açıklaması" }
 * }
 */
app.post("/translate", async (req, res) => {
  try {
    const { data, to } = req.body;

    if (!data || typeof data !== "object") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'data' object" });
    }
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'to' languages array" });
    }

    const translations = {};

    await Promise.all(
      to.map(async (lng) => {
        translations[lng] = {};
        for (const key of Object.keys(data)) {
          try {
            const { text: translatedText } = await translate(data[key], {
              to: lng,
            });
            translations[lng][key] = translatedText;
            await sleep(1000);
          } catch (e) {
            translations[lng][key] = `❌ Failed to translate: ${e.message}`;
          }
        }
      })
    );

    res.json(translations);
  } catch (error) {
    console.error("Translation Error:", error.message);
    res.status(500).json({ error: "Translation failed" });
  }
});

// ----------- Error Handler ------------
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ----------- Start Server ------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

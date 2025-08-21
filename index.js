require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const { translate } = require("@vitalets/google-translate-api");

const app = express();

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

// Translate API - supports array of target languages
app.post("/translate", async (req, res) => {
  try {
    const { text, to } = req.body;

    if (!text || !to) {
      return res
        .status(400)
        .json({ error: "Missing 'text' or 'to' languages" });
    }

    // Ensure `to` is always an array
    const languages = Array.isArray(to) ? to : [to];

    // Translate text into all requested languages
    const translations = {};
    for (const lng of languages) {
      try {
        const { text: translatedText } = await translate(text, {
          from: "auto",
          to: lng,
        });
        translations[lng] = translatedText;
      } catch (e) {
        translations[lng] = `❌ Failed to translate: ${e.message}`;
      }
    }

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

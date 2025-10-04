// server.js
// Install deps: npm i express multer cors dotenv axios

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",                 // local dev
    "https://my-frontend-jipf.vercel.app"    // deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// OpenRouter config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "gpt-4o-mini";

// Convert file buffer to Base64 Data URL
function fileBufferToBase64DataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// Utility: call OpenRouter
async function callOpenRouter(messages, model = MODEL, response_format = null) {
  const payload = { model, messages };
  if (response_format) payload.response_format = response_format;

  const resp = await axios.post(OPENROUTER_URL, payload, {
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  return resp.data;
}

/**
 * ========== ROUTES ==========
 */

// 1. Resume Parsing
app.post("/api/parse-resume", upload.single("resumeFile"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  try {
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const dataUrl = fileBufferToBase64DataUrl(fileBuffer, mimeType);

    const systemPrompt = `
You are a world-class resume parser. Extract structured info from this resume file.
Return ONLY a JSON object like:

{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string"
  },
  "summary": "string",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "dates": "string",
      "description": "string"
    }
  ],
  "skills": ["string"],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "dates": "string"
    }
  ]
}
Do NOT include markdown or extra text.
`;

    const payload = {
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Parse this resume and return structured JSON." },
            {
              type: "file",
              file: { filename: req.file.originalname, file_data: dataUrl },
            },
          ],
        },
      ],
    };

    const apiResponse = await axios.post(OPENROUTER_URL, payload, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const aiResponseText = apiResponse.data?.choices?.[0]?.message?.content;

    if (!aiResponseText) {
      return res.status(500).json({ error: "Empty AI response", raw_output: apiResponse.data });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(aiResponseText);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON", raw_output: aiResponseText });
    }

    res.json(parsedData);
  } catch (err) {
    console.error("❌ Resume error:", err.response?.data || err.message);
    res.status(500).json({ error: "Resume parsing failed", details: err.response?.data || err.message });
  }
});

// 2. Generate Interview Questions
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { skill = "React", level = "junior", count = 8 } = req.body;

    const system = {
      role: "system",
      content:
        "You are an expert technical interviewer. Generate interview questions only (numbered list).",
    };

    const user = {
      role: "user",
      content: `Create ${count} interview questions for skill: ${skill} at ${level} level.`,
    };

    const data = await callOpenRouter([system, user]);
    const text = data?.choices?.[0]?.message?.content || "";

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const questions = lines.map((l) => l.replace(/^\d+[\).\s]+/, ""));

    res.json({ questions });
  } catch (err) {
    console.error("❌ Question error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// 3. Evaluate Interview Answer
app.post("/api/evaluate", async (req, res) => {
  try {
    const { question = "", answer = "", skill = "General" } = req.body;

    const system = {
      role: "system",
      content:
        "You are a strict interviewer. Return JSON with score (1-10), summary, strengths, improvements, and suggested_resources.",
    };

    const user = {
      role: "user",
      content: `Evaluate this answer for ${skill}:\nQ: ${question}\nA: ${answer}`,
    };

    const data = await callOpenRouter([system, user]);
    const content = data?.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        score: 0,
        summary: "Invalid AI response",
        strengths: [],
        improvements: [],
        suggested_resources: [],
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("❌ Evaluate error:", err.response?.data || err.message);
    res.status(500).json({ error: "Evaluation failed" });
  }
});

// 4. Job Search (via SerpAPI)
const SERP_API_KEY = process.env.SERP_API_KEY;

app.get("/jobs", async (req, res) => {
  const { query, location } = req.query;
  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_jobs",
        q: query,
        location: location,
        api_key: SERP_API_KEY,
      },
    });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Jobs error:", err.message);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// ========== START SERVER ==========
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

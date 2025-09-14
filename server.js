import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
console.log("HF API Key loaded:", process.env.HF_API_KEY ? "✅" : "❌");
const ai = new GoogleGenAI({});

const app = express();
const upload = multer({ dest: "uploads/" });
async function parsePDF(buffer) {
  // dynamically import pdf-parse only when needed
  const { default: pdfParse } = await import("pdf-parse");
  return pdfParse(buffer); // pdfParse returns a function
}
app.use(cors());
// app.use(express.json());   // parses application/json
app.use(express.urlencoded({ extended: true })); // parses x-www-form-urlencoded

// 🔹 Function to query Hugging Face router API
// 🔹 Function to query Hugging Face router API
const mockUsers = [
  {
    name: "Pooja Shende",
    email: "poojashende267@gmail.com",
    password: "123456"
  },
  {
    name: "Rishav Mahapatra",
    email: "rishav@example.com",
    password: "abcdef"
  },
  {
    name: "John Doe",
    email: "admin@gmail.com",
    password: "Qwer1234@"
  }
];
async function getAIQuestions(resumeText) {
  const prompt = `Generate 10 interview questions based on this resume. 
  Please format the response as a numbered list from 1 to 10:\n${resumeText}`;

  try {
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
    const rawText = response.text || ""; // 🚀 Correctly access the generated text

    // 🔹 Parse numbered list into an array of questions
    const questionsArray = rawText
      .split(/\n+/)
      .filter(line => /^\d+\./.test(line))
      .map((line, idx) => {
        const questionText = line.replace(/^\d+\.\s*/, "").trim();
        return { id: idx + 1, question: questionText };
      });

    return questionsArray.length > 0
      ? questionsArray
      : [{ id: 1, question: rawText.trim() }];
      
  } catch (error) {
    console.error("❌ Error generating content with Gemini:", error);
    throw new Error("Failed to generate questions.");
  }
}


app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (req.file.mimetype !== "application/pdf")
      return res.status(400).json({ error: "Only PDF resumes supported" });

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await parsePDF(dataBuffer);
    
    const resumeText = pdfData.text;
    console.log(resumeText);
    const questions = await getAIQuestions(resumeText);
    res.json(questions);
    // const data = JSON.parse(fs.readFileSync("./mockData.json", "utf-8"));
    // res.json(data);
  } catch (err) {
    console.error("❌ Error in /upload:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/signin", express.json(), (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const mockUser = mockUsers.find(user => user.email === email && user.password === password);
    if (mockUser) {
      return res.json({ name: mockUser.name, message: "Auth successful ✅" });
    }
    return res.status(401).json({ error: "Invalid email or password" });
    // Perform sign-in logic here (e.g., check credentials)
    // res.json({ message: "Sign-in successful", email });
  } catch (err) {
    console.error("❌ Error in /signin:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

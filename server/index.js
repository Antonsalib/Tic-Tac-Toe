import express from "express";
import cors from "cors";
import OpenAI from "openai";
import Player from "./models/player.js";
import { syncModels } from "./models/index.js";

const app = express();
const PORT = 3001;

app.use(cors());

syncModels();


const OPENAI_API_KEY = "key here";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const aiModel = "gpt-4-turbo-preview";

app.get("/api/game", async (req, res) => {
  const boardJson = req.query.board;

  if (boardJson && boardJson.length) {
    const prompt = [];
    prompt.push("You are an expert tic tac toe player that only moves when it's your turn, making only one move at a time.");
    prompt.push("You play as O. Focus on winning, play extremely well.");
    prompt.push("For the JSON content I provide as input, please give me JSON output in the same format.");
    prompt.push("{board:[[],[],[]]}");

    const messages = [
      {
        role: "system",
        content: prompt.join(" "),
      },
      {
        role: "user",
        content: boardJson,
      },
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: aiModel,
        messages,
        response_format: { type: "json_object" },
      });

      const aiResponse = completion.choices[0].message.content;
      res.json({ aiResponse });
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ error: "Failed to generate AI move." });
    }
  } else {
    res.status(400).json({ error: "Missing or invalid board input." });
  }
});

app.get("/api/player", async (req, res) => {
  try {
    const players = await Player.findAll();
    return res.json(players);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch players." });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

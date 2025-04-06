// server/index.js
import express from "express";
const app = express();
import cors from "cors"; // CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
const CORS = cors();
import OpenAI from "openai";


const PORT = 3001;
app.use(CORS);
import Player from './models/player.js';
import { syncModels } from "./models/index.js";


syncModels();

app.get("/api/game", async (req, res) => {
  // insert openai key here
  const OPENAI_API_KEY="insert openai key here";
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const aiModel = "gpt-4-turbo-preview";
  const boardJson = req.query.board;

  if (boardJson && boardJson.length) {

    const prompt = [];
    prompt.push('You are an expert tic tac toe player that only moves when its your turn, making only one move at a time.')
    prompt.push('You play as O. focus on winning, play extremely well.')
    prompt.push('For the json content I provide as input, please give me json output in the same format.');
    prompt.push('{board:[[],[],[]]}')

    const messages = [
      {
        role: "system",
        content: prompt.join(' '),
      },
      {
        role: "user",
        content: boardJson,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages,
      response_format:{ "type": "json_object" }
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({ aiResponse });
  }
});


app.get("/api/player", async (req, res) => {
  // Find all players
    const players = await Player.findAll();
  return res.json(players);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

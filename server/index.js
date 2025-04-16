import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { Op, literal } from "sequelize";
import Player from "./models/player.js";
import Move from "./models/int.js";
import { syncModels } from "./models/index.js";
import sequelize from "./config/database.js"; // Import the Sequelize instance

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Synchronize your models (this also seeds the AI Player and test data as needed)
syncModels();

// Set up OpenAI (replace "KEY HERE" with your actual OpenAI API key)
const OPENAI_API_KEY = "KEY HERE";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const aiModel = "gpt-4-turbo-preview";

// Endpoint for generating the AI move
app.get("/api/game", async (req, res) => {
  const boardJson = req.query.board;
  console.log("Received board from client:", boardJson);

  if (!boardJson || !boardJson.length) {
    return res.status(400).json({ error: "Missing or invalid board input." });
  }

  try {
    JSON.parse(boardJson);
  } catch (error) {
    console.error("Error parsing board JSON:", error);
    return res.status(400).json({ error: "Invalid board JSON format" });
  }

  const prompt = [];
  prompt.push("You are an expert tic tac toe player that only moves when it's your turn, making only one move at a time.  You play using a minmax algorithm");
  prompt.push("You play as O. Focus on winning, play extremely well.");
  prompt.push("For the JSON content I provide as input, please give me JSON output in the same format.");
  prompt.push("{board:[[],[],[]]}");

  const messages = [
    { role: "system", content: prompt.join(" ") },
    { role: "user", content: boardJson },
  ];

  try {
    console.log("Sending request to OpenAI with board:", boardJson);
    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages,
      response_format: { type: "json_object" },
    });
    const aiResponse = completion.choices[0].message.content;
    console.log("Received AI response:", aiResponse);
    res.json({ aiResponse });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Failed to generate AI move." });
  }
});

// GET endpoint to fetch all players for the leaderboard
app.get("/api/player", async (req, res) => {
  try {
    const players = await Player.findAll({
      order: [
        ["total_wins", "DESC"],
        ["total_games", "DESC"],
      ],
    });
    console.log(`Returning ${players.length} players for leaderboard`);
    return res.json(players);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch players." });
  }
});

// GET endpoint to fetch a specific player by name
app.get("/api/player/:name", async (req, res) => {
  try {
    const playerName = req.params.name;
    console.log(`Looking up player: ${playerName}`);
    const player = await Player.findOne({
      where: { player_id: playerName },
    });
    if (!player) {
      console.log(`Player "${playerName}" not found`);
      return res.status(404).json({ error: "Player not found" });
    }
    console.log(`Found player: ${player.player_id}`);
    return res.json(player);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch player." });
  }
});

// POST endpoint to create a new player (or ensure one exists)
app.post("/api/player/create", async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      console.error("Missing playerName in request body");
      return res.status(400).json({ error: "Player name is required" });
    }
    console.log(`Creating/finding player: "${playerName}"`);
    const [player, created] = await Player.findOrCreate({
      where: { player_id: playerName },
      defaults: {
        total_wins: 0,
        total_losses: 0,
        total_ties: 0,
        total_games: 0,
      },
    });
    console.log(`Player "${playerName}" ${created ? "created" : "already exists"}`);
    return res.json(player);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to create player." });
  }
});

// POST endpoint to update player statistics using atomic updates
app.post("/api/player/update", async (req, res) => {
  try {
    const { playerName, result } = req.body;
    if (!playerName || !result) {
      console.error("Missing playerName or result in request body");
      return res.status(400).json({ error: "Player name and result are required" });
    }
    console.log(`Updating player "${playerName}" with result: ${result}`);

    // Build the update object using Sequelize's literal to increment fields
    const updates = { total_games: literal("total_games + 1") };

    if (result === "win") {
      updates.total_wins = literal("total_wins + 1");
    } else if (result === "loss") {
      updates.total_losses = literal("total_losses + 1");
    } else if (result === "tie") {
      updates.total_ties = literal("total_ties + 1");
    } else {
      console.error("Invalid result:", result);
      return res.status(400).json({ error: "Invalid result type" });
    }

    // Update the player's statistics atomically
    await Player.update(updates, { where: { player_id: playerName } });

    // Retrieve the updated record
    const updatedPlayer = await Player.findOne({ where: { player_id: playerName } });
    console.log(`Player ${playerName} updated successfully`, updatedPlayer);
    return res.json(updatedPlayer);
  } catch (error) {
    console.error("Error updating player stats:", error);
    return res.status(500).json({ error: "Failed to update player statistics." });
  }
});

// (Optional) Additional endpoints (like move logging) can be added below.

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

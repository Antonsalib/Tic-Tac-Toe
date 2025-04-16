// /server/models/index.js
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import Player from "./player.js"; // Corrected path: player.js is in the same directory
import Move from "./int.js";      // Corrected path: int.js is in the same directory

const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("All models were synchronized successfully.");

    // Ensure AI Player exists
    const [aiPlayer] = await Player.findOrCreate({
      where: { player_id: "AI Player" },
      defaults: {
        total_wins: 0,
        total_losses: 0,
        total_ties: 0,
        total_games: 0
      }
    });
    console.log("AI Player created or found:", aiPlayer.player_id);

    // Count all players except AI Player using [Op.ne] from Sequelize
    const playerCount = await Player.count({
      where: {
        player_id: {
          [Op.ne]: "AI Player"
        }
      }
    });

    // Seed test data if there are fewer than 5 players (adjust as needed)
    if (playerCount < 5) {
      const players = [];
      const names = [
        "John", "Emma", "Alex", "Sarah", "Michael",
        "Olivia", "William", "Sophia", "James", "Charlotte"
      ];

      for (let i = 0; i < 10; i++) {
        const total_games = Math.floor(Math.random() * 20) + 1;
        // Distribute wins, losses, and ties so that they sum to total_games
        let total_wins = Math.floor(Math.random() * (total_games + 1));
        let remaining_games = total_games - total_wins;
        let total_losses = Math.floor(Math.random() * (remaining_games + 1));
        let total_ties = total_games - total_wins - total_losses;

        players.push({
          player_id: names[i],
          total_wins,
          total_losses,
          total_ties,
          total_games
        });
      }

      await Player.bulkCreate(players);
      console.log("Players inserted successfully.");
    }
  } catch (error) {
    console.error("Error synchronizing models:", error);
  }
};

export { sequelize, Player, Move, syncModels };

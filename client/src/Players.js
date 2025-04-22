import React, { useEffect, useState, useCallback } from "react";
import "./Players.css";

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("total_wins");
  const [sortDirection, setSortDirection] = useState("desc");
  const [debugMessage, setDebugMessage] = useState("");
  const currentPlayerName = localStorage.getItem("ticTacToePlayerName");

  // Function to fetch players from the backend
  const fetchPlayers = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch("http://localhost:3001/api/player");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      // Optional: Verify the current player exists in the data,
      // and if not, you might want to call your create-player endpoint.
      if (currentPlayerName) {
        const exists = data.some(
          (p) => p.player_id === currentPlayerName
        );
        if (!exists) {
          setDebugMessage(
            `Current player "${currentPlayerName}" not found; please ensure you have been created.`
          );
          // Optionally, trigger a player creation routine here.
        }
      }
      setPlayers(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching players:", err);
      setError("Failed to load leaderboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPlayerName]);

  // Fetch players on mount and set up auto-refresh every 5 seconds
  useEffect(() => {
    fetchPlayers(true);
    const intervalId = setInterval(() => {
      fetchPlayers(false);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchPlayers]);

  const comparePlayers = (a, b) => {
    let aVal, bVal;
    if (sortField === "win_percentage") {
      aVal = a.total_games > 0 ? (a.total_wins / a.total_games) * 100 : 0;
      bVal = b.total_games > 0 ? (b.total_wins / b.total_games) * 100 : 0;
    } else {
      aVal = a[sortField];
      bVal = b[sortField];
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    } else {
      return sortDirection === "asc"
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString());
    }
  };
  

  const sortedPlayers = [...players].sort(comparePlayers);

  // Toggle sort direction when clicking on a header
  const handleSort = (field) => {
    const newDirection =
      field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <button
          className="refresh-button"
          onClick={() => fetchPlayers(true)}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-indicator">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : players.length === 0 ? (
        <div className="no-data">No players found.</div>
      ) : (
        <div className="table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("player_id")}>
                  Player{" "}
                  {sortField === "player_id" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("total_wins")}>
                  Wins{" "}
                  {sortField === "total_wins" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("total_losses")}>
                  Losses{" "}
                  {sortField === "total_losses" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("total_ties")}>
                  Ties{" "}
                  {sortField === "total_ties" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("total_games")}>
                  Games{" "}
                  {sortField === "total_games" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("win_percentage")}>
                  Win %{" "}
                  {sortField === "win_percentage" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => {
                const winPercentage =
                  player.total_games > 0
                    ? ((player.total_wins / player.total_games) * 100).toFixed(1)
                    : "0.0";
                const isCurrent = player.player_id === currentPlayerName;
                return (
                  <tr key={player.player_id} className={isCurrent ? "highlighted-player" : ""}>

                    <td>{player.player_id}</td>
                    <td>{player.total_wins}</td>
                    <td>{player.total_losses}</td>
                    <td>{player.total_ties}</td>
                    <td>{player.total_games}</td>
                    <td>{winPercentage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {debugMessage && <div className="debug-message">{debugMessage}</div>}
    </div>
  );
};

export default Players;

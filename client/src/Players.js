import React, { useEffect, useState } from "react";
import "./Players.css"; // Ensure this CSS file is correctly linked

const Players = () => {
  const [player, setUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/player`)
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setUser(data); // Ensure data is an array
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <h1>Leaderboard</h1>
      </div>
      
      <div className="table-container">
        {Array.isArray(player) && player.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Ties</th>
                <th>Total Games</th>
              </tr>
            </thead>
            <tbody>
              {player.map((data) => (
                <tr key={data.player_id}>
                  <td>{data.player_id}</td>
                  <td>{data.total_wins}</td>
                  <td>{data.total_losses}</td>
                  <td>{data.total_ties}</td>
                  <td>{data.total_games}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No players found or data is not in the expected format.</p>
        )}
      </div>
    </>
  );
}

export default Players;

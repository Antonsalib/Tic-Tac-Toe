// Users.jsx

import React from "react";
import { useEffect, useState } from "react";

const Players = () => {

  const [player, setuser] = useState([]);
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
          setuser(data); // Ensure data is an array
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
        <div style={{
            display: "flex",
            justifyContent: "center"
        }}>
            <h1>Players</h1>
        </div>
        <div>
  {Array.isArray(player) && player.length > 0 ? (
    player.map((data) => (
      <div key={data.player_id} style={{ marginBottom: "10px" }}>
        <p><strong>ID:</strong> {data.player_id}</p>
        <p><strong>Wins:</strong> {data.total_wins}</p>
        <p><strong>Losses:</strong> {data.total_losses}</p>
        <p><strong>Ties:</strong> {data.total_ties}</p>
        <p><strong>Total Games:</strong> {data.total_games}</p>
      </div>
    ))
  ) : (
    <p>No players found or data is not in the expected format.</p>
  )}
</div>
    </>
  );
}

export default Players;
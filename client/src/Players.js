import React, { useEffect, useState } from "react";
import "./Players.css";

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('win_percentage');
  const [sortDirection, setSortDirection] = useState('desc');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchPlayers();
    
    // Set up auto-refresh every 10 seconds 
    const interval = setInterval(() => {
      fetchPlayers(false); // Silent refresh (don't show loading indicator)
    }, 10000);
    
    setRefreshInterval(interval);
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlayers = (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    fetch(`http://localhost:3001/api/player`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Sort the data by the current sort field
        const sortedData = sortPlayers(data, sortField, sortDirection);
        setPlayers(sortedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching players:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  const sortPlayers = (playersData, field, direction) => {
    return [...playersData].sort((a, b) => {
      // Check for the current user's name to highlight in the UI
      const currentPlayerName = localStorage.getItem('ticTacToePlayerName');
      
      // Handle string comparison for player_id
      if (field === 'player_id') {
        // Current player should always be at the top when sorting by name
        if (a.player_id === currentPlayerName) return direction === 'asc' ? -1 : 1;
        if (b.player_id === currentPlayerName) return direction === 'asc' ? 1 : -1;
        
        return direction === 'asc' 
          ? a[field].localeCompare(b[field])
          : b[field].localeCompare(a[field]);
      } 
      // Handle win percentage specially 
      else if (field === 'win_percentage') {
        const aWinPct = a.total_games > 0 ? (a.total_wins / a.total_games) : 0;
        const bWinPct = b.total_games > 0 ? (b.total_wins / b.total_games) : 0;
        
        return direction === 'asc' ? aWinPct - bWinPct : bWinPct - aWinPct;
      }
      // Handle numeric comparison for other fields
      else {
        return direction === 'asc' 
          ? a[field] - b[field]
          : b[field] - a[field];
      }
    });
  };

  const handleSort = (field) => {
    const newDirection = 
      field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    
    setSortField(field);
    setSortDirection(newDirection);
    
    // Sort the players array
    const sortedPlayers = sortPlayers(players, field, newDirection);
    setPlayers(sortedPlayers);
  };

  // Helper function to render sort arrows
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Get current player name from localStorage
  const currentPlayerName = localStorage.getItem('ticTacToePlayerName');

  if (loading && players.length === 0) {
    return <div className="loading-indicator">Loading leaderboard data...</div>;
  }
  
  if (error) {
    return <div className="error-message">
      Error: {error}
      <button className="retry-button" onClick={() => fetchPlayers()}>
        Retry
      </button>
    </div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Tic-Tac-Toe Leaderboard</h1>
        <button 
          className={`refresh-button ${loading ? 'refreshing' : ''}`} 
          onClick={() => fetchPlayers()}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="table-container">
        {Array.isArray(players) && players.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('player_id')}>
                  Player Name {renderSortIcon('player_id')}
                </th>
                <th onClick={() => handleSort('total_wins')}>
                  Wins {renderSortIcon('total_wins')}
                </th>
                <th onClick={() => handleSort('total_losses')}>
                  Losses {renderSortIcon('total_losses')}
                </th>
                <th onClick={() => handleSort('total_ties')}>
                  Ties {renderSortIcon('total_ties')}
                </th>
                <th onClick={() => handleSort('total_games')}>
                  Games {renderSortIcon('total_games')}
                </th>
                <th onClick={() => handleSort('win_percentage')}>
                  Win % {renderSortIcon('win_percentage')}
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => {
                // Check if this is the current player
                const isCurrentPlayer = player.player_id === currentPlayerName;
                const winPercentage = player.total_games > 0 
                  ? ((player.total_wins / player.total_games) * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <tr 
                    key={player.id} 
                    className={`
                      ${index < 3 ? 'top-player' : ''}
                      ${isCurrentPlayer ? 'current-player' : ''}
                    `}
                  >
                    <td>
                      {player.player_id}
                      {isCurrentPlayer && <span className="you-badge"> (You)</span>}
                    </td>
                    <td>{player.total_wins}</td>
                    <td>{player.total_losses}</td>
                    <td>{player.total_ties}</td>
                    <td>{player.total_games}</td>
                    <td>{winPercentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No players found. Start playing to get on the leaderboard!</p>
          </div>
        )}
      </div>
      
      {/* Message to show if current player isn't on the leaderboard */}
      {currentPlayerName && !players.some(player => player.player_id === currentPlayerName) && (
        <div className="player-not-found">
          <p>Your player name "{currentPlayerName}" is not on the leaderboard yet. Play a game to be added!</p>
        </div>
      )}
    </div>
  );
};

export default Players;
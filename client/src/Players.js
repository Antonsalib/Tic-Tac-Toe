import React, { useEffect, useState } from "react";
import "./Players.css";

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('total_wins');
  const [sortDirection, setSortDirection] = useState('desc');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [debugMessage, setDebugMessage] = useState("");
  const [createPlayerLoading, setCreatePlayerLoading] = useState(false);

  // Get current player name from localStorage
  const currentPlayerName = localStorage.getItem('ticTacToePlayerName');

  useEffect(() => {
    console.log(`Current player from localStorage: "${currentPlayerName}"`);
    
    if (currentPlayerName) {
      // Force player creation if we have a name
      handleCreatePlayer();
    }
    
    // Initial fetch
    fetchPlayers();
    
    // Set up auto-refresh every 5 seconds (more frequent for better responsiveness)
    const interval = setInterval(() => {
      fetchPlayers(false); // Silent refresh
    }, 5000);
    
    setRefreshInterval(interval);
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerName]);

  const fetchPlayers = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // Get ALL players with no filtering
      const response = await fetch('http://localhost:3001/api/player');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} players from API:`, data);
      
      // Important: Always check if current player exists in the data
      if (currentPlayerName) {
        const playerFound = data.some(p => p.player_id === currentPlayerName);
        console.log(`Current player "${currentPlayerName}" found in data: ${playerFound}`);
        
        if (!playerFound) {
          console.log("Player not found in data, will create now");
          await handleCreatePlayer();
          return; // handleCreatePlayer will call fetchPlayers again
        }
      }
      
      // Sort the data - always include current player
      const sortedData = sortPlayers(data, sortField, sortDirection);
      setPlayers(sortedData);
    } catch (error) {
      console.error("Error fetching players:", error);
      setError("Failed to load leaderboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Force create the current player AND add to the local state
  const handleCreatePlayer = async () => {
    if (!currentPlayerName) {
      setDebugMessage("No player name set. Please set a name first.");
      return;
    }
    
    setCreatePlayerLoading(true);
    setDebugMessage(`Setting up player "${currentPlayerName}" on leaderboard...`);
    
    try {
      // First, create the player in the database
      const response = await fetch('http://localhost:3001/api/player/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: currentPlayerName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      
      const newPlayer = await response.json();
      console.log("Player created or found:", newPlayer);
      
      // If the player has no games yet, add a placeholder tie game
      // This ensures they appear in the leaderboard
      if (newPlayer.total_games === 0) {
        console.log("Player has no games, adding a placeholder game");
        
        const updateResponse = await fetch('http://localhost:3001/api/player/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerName: currentPlayerName,
            result: 'tie'
          })
        });
        
        if (!updateResponse.ok) {
          console.warn("Warning: Could not initialize player stats");
        } else {
          console.log("Player initialized with placeholder game");
        }
      }
      
      setDebugMessage(`Player "${currentPlayerName}" is now on the leaderboard!`);
      
      // Now fetch all players again to ensure we have the updated list
      fetchPlayers(false);
      
    } catch (error) {
      console.error("Error creating player:", error);
      setDebugMessage(`Error setting up player: ${error.message}`);
    } finally {
      setCreatePlayerLoading(false);
    }
  };

  const sortPlayers = (playersData, field, direction) => {
    return [...playersData].sort((a, b) => {
      // Always show current player at top
      if (a.player_id === currentPlayerName) return -1;
      if (b.player_id === currentPlayerName) return 1;
      
      // Handle string comparison for player_id
      if (field === 'player_id') {
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

  // Check if current player exists in the list
  const currentPlayerExists = currentPlayerName && players.some(p => p.player_id === currentPlayerName);

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
        <div className="leaderboard-actions">
          <button 
            className={`refresh-button ${loading ? 'refreshing' : ''}`} 
            onClick={() => fetchPlayers()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {currentPlayerName && !currentPlayerExists && (
            <button 
              className="create-player-button" 
              onClick={handleCreatePlayer}
              disabled={createPlayerLoading}
              style={{ marginLeft: '10px' }}
            >
              {createPlayerLoading ? 'Adding...' : 'Add Me to Leaderboard'}
            </button>
          )}
        </div>
      </div>
      
      {/* Current player info */}
      {currentPlayerName && (
        <div className="current-player-info" style={{
          margin: '10px 0',
          padding: '10px',
          background: currentPlayerExists ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
          borderRadius: '4px'
        }}>
          <strong>Current Player:</strong> {currentPlayerName}
          {!currentPlayerExists && (
            <div style={{ marginTop: '5px' }}>
              Your player is not on the leaderboard yet. Click "Add Me to Leaderboard" to add yourself.
            </div>
          )}
        </div>
      )}
      
      {/* Debug message */}
      {debugMessage && (
        <div className="debug-message" style={{
          margin: '10px 0',
          padding: '10px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          {debugMessage}
          {createPlayerLoading && <span> Loading...</span>}
        </div>
      )}
      
      {/* Players table */}
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
                    key={player.id || index} 
                    className={`
                      ${index < 3 ? 'top-player' : ''}
                      ${isCurrentPlayer ? 'current-player' : ''}
                    `}
                    style={isCurrentPlayer ? { fontWeight: 'bold', backgroundColor: 'rgba(76, 175, 80, 0.1)' } : {}}
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
      
      {/* Player count info */}
      <div className="player-count" style={{ marginTop: '10px', color: '#6c757d' }}>
        {players.length} player{players.length !== 1 ? 's' : ''} on the leaderboard
      </div>
    </div>
  );
};

export default Players;
import React, { useState, useEffect } from 'react';
import './PlayerName.css';

const PlayerName = ({ isOpen, onClose, onSave, savedName }) => {
  const [playerName, setPlayerName] = useState(savedName || '');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Reset player name when modal opens with saved name
    if (isOpen && savedName) {
      setPlayerName(savedName);
    }
  }, [isOpen, savedName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    
    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // First, create the player in the database
      const createResponse = await fetch('http://localhost:3001/api/player/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: trimmedName
        })
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create player');
      }
      
      const player = await createResponse.json();
      console.log("Player created or found:", player);
      
      // If the player has no games yet, add a placeholder tie game
      // This ensures they appear in the leaderboard
      if (player.total_games === 0) {
        console.log("New player has no games, adding a placeholder game");
        
        const updateResponse = await fetch('http://localhost:3001/api/player/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerName: trimmedName,
            result: 'tie'
          })
        });
        
        if (!updateResponse.ok) {
          console.warn("Warning: Could not initialize player stats");
        } else {
          console.log("Player initialized with placeholder game");
        }
      }
      
      // Save the player name locally
      onSave(trimmedName);
      onClose();
      
    } catch (error) {
      console.error("Error setting up player:", error);
      setError("There was a problem setting up your player. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle closing without entering a name
  const handleCancel = () => {
    // If the user hasn't entered a name yet, set a default
    if (!savedName && !playerName.trim()) {
      onSave('Guest Player');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Enter Your Name</h2>
        <p>Your name will appear on the leaderboard</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              placeholder="Your name"
              autoFocus
              className={error ? 'error' : ''}
              disabled={isCreating}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="button-group">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={isCreating}
            >
              {isCreating ? 'Setting up...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerName;
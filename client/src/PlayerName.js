import React, { useState, useEffect } from 'react';
import './PlayerName.css';

const PlayerName = ({ isOpen, onClose, onSave, savedName }) => {
  const [playerName, setPlayerName] = useState(savedName || '');
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset player name when modal opens with saved name
    if (isOpen && savedName) {
      setPlayerName(savedName);
    }
  }, [isOpen, savedName]);

  const handleSubmit = (e) => {
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
    
    // Save the player name
    onSave(trimmedName);
    onClose();
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
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="button-group">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerName;
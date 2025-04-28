import "./App.css";
import { useState, useEffect, Fragment, useCallback } from "react";
import PlayerName from "./PlayerName";
import { playSound } from './PlaySound';

function TicTacToe() {
  // ===== STATE MANAGEMENT =====
  // Game state
  const [board, setBoard] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [status, setStatus] = useState("ongoing");
  const [loading, setLoading] = useState(false);
  const [gameId, setGameId] = useState(null);
  
  // Game mode
  const [gameMode, setGameMode] = useState("ai"); // "ai" or "pvp"
  
  // Player configuration
  const [playerShape, setPlayerShape] = useState("X");
  const aiShape = playerShape === "X" ? "O" : playerShape === "O" ? "X" : 
                  playerShape === "◼" ? "🔺" : "◼";
  
  // Player info
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ticTacToePlayerName') || '';
  });
  const [player2Name, setPlayer2Name] = useState(() => {
    return localStorage.getItem('ticTacToePlayer2Name') || 'Player 2';
  });
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [isPlayer2NameOpen, setIsPlayer2NameOpen] = useState(false);
  
  // Scores
  const [scores, setScores] = useState(() => {
    const savedScores = localStorage.getItem('ticTacToeScores');
    return savedScores ? JSON.parse(savedScores) : { X: 0, O: 0, Ties: 0 };
  });
  
  // PvP Scores
  const [pvpScores, setPvpScores] = useState(() => {
    const savedPvpScores = localStorage.getItem('ticTacToePvpScores');
    return savedPvpScores ? JSON.parse(savedPvpScores) : { 
      player1: 0, 
      player2: 0, 
      ties: 0 
    };
  });

  // ===== GAME ID GENERATION =====
  const generateGameId = useCallback(() => {
    return Date.now().toString();
  }, []);

  // ===== DATABASE OPERATIONS =====
  const createPlayerInDatabase = useCallback((name) => {
    if (gameMode === "pvp") return; // Skip database operations in PvP mode
    
    fetch('http://localhost:3001/api/player/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName: name
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Player created or found:', data);
    })
    .catch(error => {
      console.error('Error creating player:', error);
    });
  }, [gameMode]);

  const updateLeaderboard = useCallback((result) => {
    if (gameMode === "pvp" || !playerName) return; // Skip in PvP mode
    
    const dbPlayerName = playerName.trim() || 'Guest Player';
    console.log(`Updating leaderboard for ${dbPlayerName} with result: ${result}`);
    
    // Create player first
    fetch('http://localhost:3001/api/player/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName: dbPlayerName
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to ensure player exists');
      }
      // Then update stats
      return fetch('http://localhost:3001/api/player/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: dbPlayerName,
          result: result
        })
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update stats');
      }
      return response.json();
    })
    .then(data => {
      console.log('Player stats updated:', data);
    })
    .catch(error => {
      console.error('Error updating player stats:', error);
    });
    
    // Update AI player stats
    const aiResult = result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'tie';
    fetch('http://localhost:3001/api/player/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName: 'AI Player',
        result: aiResult
      })
    })
    .then(response => response.json())
    .catch(error => {
      console.error('Error updating AI stats:', error);
    });
  }, [gameMode, playerName]);

  const logMove = useCallback((player, row, col, gameResult = null) => {
    if (!gameId || gameMode === "pvp") return;
    
    fetch('http://localhost:3001/api/int', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id: gameId,
        player,
        row,
        col,
        gameStatus: gameResult || status,
        timestamp: new Date().toISOString()
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error logging move:', error);
    });
  }, [status, gameId, gameMode]);

  // ===== GAME LOGIC =====
  const checkGameStatus = useCallback(() => {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
        return board[i][0];
      }
    }
    
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
        return board[0][i];
      }
    }
    
    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }
    
    // Check for tie
    if (!board.some(row => row.includes(""))) {
      return "Tie";
    }
    
    return null;
  }, [board]);

  // ===== AI LOGIC =====
  const makeAIMove = useCallback(() => {
    if (gameMode === "pvp") return; // Skip AI moves in PvP mode
    
    setLoading(true);
    const boardJson = JSON.stringify({ board });
    
    console.log("Sending board to AI:", boardJson);
    
    fetch(`http://localhost:3001/api/game?board=${encodeURIComponent(boardJson)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("AI response received:", data);
        if (!data.aiResponse) {
          throw new Error("No AI response received");
        }
        
        const aiResponseObj = JSON.parse(data.aiResponse);
        if (!aiResponseObj.board || !Array.isArray(aiResponseObj.board)) {
          throw new Error("Invalid AI response format");
        }
        
        const aiBoard = aiResponseObj.board;
        
        // Find which cell the AI played in
        let moveRow = -1;
        let moveCol = -1;
        outer: for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (aiBoard[i][j] !== board[i][j]) {
              moveRow = i;
              moveCol = j;
              break outer;
            }
          }
        }
        
        // FIX: Ensure AI uses its proper shape
        if (moveRow !== -1 && moveCol !== -1) {
          // Create a new board and set the AI's move with the correct shape
          const newBoard = board.map(row => [...row]);
          newBoard[moveRow][moveCol] = aiShape;
          
          logMove(aiShape, moveRow, moveCol);
          playSound('/sound/bubble-pop-2-293341.mp3');
          setBoard(newBoard);
          setCurrentPlayer(playerShape);
          setLoading(false);
        } else {
          throw new Error("Couldn't determine AI move");
        }
      })
      .catch((error) => {
        console.error("Error with AI move:", error);
        setLoading(false);
        alert("There was an error with the AI's move. Please try again.");
      });
  }, [board, gameMode, logMove, aiShape, playerShape]);

  // ===== UI HANDLERS =====
  const handleCellClick = useCallback((row, col) => {
    // PvP mode allows both X and O to be played by users
    if (gameMode === "pvp") {
      if (!playerName) {
        setIsNameOpen(true);
        return;
      }
      
      if (board[row][col] === "" && status === "ongoing" && !loading) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);
        playSound('/sound/select-sound-121244.mp3');
        // Toggle player
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
      return;
    }
    
    // AI mode - prompt for name if not set
    if (!playerName) {
      setIsNameOpen(true);
      return;
    }
    
    // AI mode - user can only play as their chosen shape
    if (board[row][col] === "" && currentPlayer === playerShape && status === "ongoing" && !loading) {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = playerShape;
      setBoard(newBoard);
      playSound('/sound/select-sound-121244.mp3');
      setCurrentPlayer(aiShape);
      
      const result = checkGameStatus();
      logMove(playerShape, row, col, result);
    }
  }, [playerName, board, currentPlayer, status, loading, gameMode, playerShape, aiShape, checkGameStatus, logMove]);

  const handleSavePlayerName = useCallback((name) => {
    const validName = name.trim() ? name : 'Guest Player';
    setPlayerName(validName);
    localStorage.setItem('ticTacToePlayerName', validName);
    if (gameMode === "ai") {
      createPlayerInDatabase(validName);
    }
  }, [createPlayerInDatabase, gameMode]);

  const handleSavePlayer2Name = useCallback((name) => {
    const validName = name.trim() ? name : 'Player 2';
    setPlayer2Name(validName);
    localStorage.setItem('ticTacToePlayer2Name', validName);
  }, []);

  const resetGame = useCallback(() => {
    setBoard([["", "", ""], ["", "", ""], ["", "", ""]]);
    setCurrentPlayer(playerShape);  // FIX: Always start with player's shape in AI mode
    setStatus("ongoing");
    setGameId(generateGameId());
  }, [generateGameId, playerShape]);

  const resetScoreboard = useCallback(() => {
    if (gameMode === "pvp") {
      setPvpScores({ player1: 0, player2: 0, ties: 0 });
      localStorage.removeItem('ticTacToePvpScores');
    } else {
      setScores({ X: 0, O: 0, Ties: 0 });
      localStorage.removeItem('ticTacToeScores');
    }
  }, [gameMode]);

  const toggleGameMode = useCallback(() => {
    setGameMode(prevMode => prevMode === "ai" ? "pvp" : "ai");
    resetGame();
  }, [resetGame]);

  const changePlayerName = useCallback(() => {
    setIsNameOpen(true);
  }, []);

  const changePlayer2Name = useCallback(() => {
    setIsPlayer2NameOpen(true);
  }, []);

  // ===== EFFECTS =====
  // Initialize a new game with a unique ID
  useEffect(() => {
    setGameId(generateGameId());
  }, [generateGameId]);

  // Save scores to localStorage
  useEffect(() => {
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
  }, [scores]);

  // Save PvP scores to localStorage
  useEffect(() => {
    localStorage.setItem('ticTacToePvpScores', JSON.stringify(pvpScores));
  }, [pvpScores]);

  // Save player names to localStorage
  useEffect(() => {
    localStorage.setItem('ticTacToePlayerName', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('ticTacToePlayer2Name', player2Name);
  }, [player2Name]);

  // Reset current player when playerShape changes
  useEffect(() => {
    if (gameMode === "ai" && status === "ongoing" && !board.flat().some(cell => cell !== "")) {
      setCurrentPlayer(playerShape);
    }
  }, [playerShape, gameMode, status, board]);

  // Process the game result when status changes
  useEffect(() => {
    const result = checkGameStatus();
    if (result && status === "ongoing") {
      let soundToPlay = "";
      
      if (gameMode === "pvp") {
        // PvP mode score tracking
        const newPvpScores = { ...pvpScores };
        let newStatus = "";
        
        if (result === 'X' || result === 'O' || result === '◼' || result === '🔺') {
          // Determine which player won
          if (result === "X") {
            newStatus = `${result} wins - ${playerName}`;
            newPvpScores.player1 += 1;
            soundToPlay = '/sound/success_bell-6776.mp3';
          } else if (result === "O") {
            newStatus = `${result} wins - ${player2Name}`;
            newPvpScores.player2 += 1;
            soundToPlay = '/sound/achievement-video-game-type-1-230515.mp3';
          }
        } else if (result === 'Tie') {
          newStatus = "It's a tie";
          newPvpScores.ties += 1;
          soundToPlay = '/sound/080205_life-lost-game-over-89697.mp3';
        }
        
        setPvpScores(newPvpScores);
        setStatus(newStatus);
      } else {
        // AI mode score tracking
        let newScores = { ...scores };
        let newStatus = "";
        
        if (result === 'X' || result === 'O' || result === '◼' || result === '🔺') {
          // Determine if the player or AI won
          if (result === playerShape) {
            newStatus = `${result} wins - You`;
            newScores[playerShape] = (newScores[playerShape] || 0) + 1;
            updateLeaderboard('win');
            soundToPlay = '/sound/success_bell-6776.mp3';
          } else {
            newStatus = `${result} wins - AI`;
            newScores[aiShape] = (newScores[aiShape] || 0) + 1;
            updateLeaderboard('loss');
            soundToPlay = '/sound/080205_life-lost-game-over-89697.mp3';
          }
        } else if (result === 'Tie') {
          newStatus = "It's a tie";
          newScores.Ties += 1;
          updateLeaderboard('tie');
          soundToPlay = '/sound/achievement-video-game-type-1-230515.mp3';
        }
        
        setScores(newScores);
        setStatus(newStatus);
      }
      
      if (soundToPlay) {
        playSound(soundToPlay);
      }
    }
  }, [board, status, scores, pvpScores, gameMode, playerName, player2Name, playerShape, aiShape, checkGameStatus, updateLeaderboard]);

  // Trigger AI move when it's AI's turn in AI mode
  useEffect(() => {
    if (gameMode === "ai" && currentPlayer === aiShape) {
      const result = checkGameStatus();
      if (result === null && status === 'ongoing') {
        makeAIMove();
      }
    }
  }, [currentPlayer, status, gameMode, makeAIMove, checkGameStatus, aiShape]);

  // Check if player name exists, otherwise prompt
  useEffect(() => {
    if (!playerName) {
      setIsNameOpen(true);
    } else if (gameMode === "ai") {
      createPlayerInDatabase(playerName);
    }
  }, [playerName, gameMode, createPlayerInDatabase]);

  // ===== RENDERING HELPERS =====
  const renderShape = (value) => {
    const shapes = {
      'X': <i className="ri-close-large-line" style={{ fontSize: '32px', color: '#f0a500' }}></i>,
      'O': <i className="ri-circle-line" style={{ fontSize: '32px', color: '#333' }}></i>,
      '◼': <i className="ri-square-line" style={{ fontSize: '32px', color: '#3b82f6' }}></i>,
      '🔺': <i className="ri-triangle-line" style={{ fontSize: '32px', color: '#ef4444' }}></i>
    };
    return shapes[value] || null;
  };

  const renderCell = (row, col) => {
    return (
      <button
        onClick={() => handleCellClick(row, col)}
        disabled={loading || status !== 'ongoing'}
        className="cell-button">
        {renderShape(board[row][col])}
      </button>
    );
  };

  // ===== COMPONENT RENDER =====
  return (
    <div className="board-container">
      {/* Game Mode Toggle */}
      <div className="game-mode-selector">
        <button 
          className="mode-toggle-button"
          onClick={toggleGameMode}
          style={{ backgroundColor: '#f0a500', color: 'white' }}
        >
          Switch to {gameMode === "ai" ? "Player vs Player" : "Player vs AI"}
        </button>
      </div>

      {/* Player Info */}
      <div className="player-info">
        {gameMode === "ai" ? (
          <div className="player-name-display">
            <span>Player: {playerName || 'Guest'}</span>
            <button className="change-name-button" onClick={changePlayerName}>
              Change Name
            </button>
          </div>
        ) : (
          <div className="players-display">
            <div className="player-name-display">
              <span>Player 1 (X): {playerName || 'Player 1'}</span>
              <button className="change-name-button" onClick={changePlayerName}>
                Change Name
              </button>
            </div>
            <div className="player-name-display">
              <span>Player 2 (O): {player2Name}</span>
              <button className="change-name-button" onClick={changePlayer2Name}>
                Change Name
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scoreboard - Different display based on game mode */}
      {gameMode === "ai" ? (
        <div className="scoreboard">
          <div className="score-item">
            <span className="player-label">{playerName || 'Player'} ({playerShape})</span>
            <span className="score">{scores[playerShape] || 0}</span>
          </div>
          <div className="score-item">
            <span className="player-label">AI ({aiShape})</span>
            <span className="score">{scores[aiShape] || 0}</span>
          </div>
          <div className="score-item">
            <span className="player-label">Ties</span>
            <span className="score">{scores.Ties}</span>
          </div>
          <button className="reset-scoreboard-button" onClick={resetScoreboard}>
            Reset Scores
          </button>
        </div>
      ) : (
        <div className="scoreboard">
          <div className="score-item">
            <span className="player-label">{playerName || 'Player 1'} (X)</span>
            <span className="score">{pvpScores.player1}</span>
          </div>
          <div className="score-item">
            <span className="player-label">{player2Name} (O)</span>
            <span className="score">{pvpScores.player2}</span>
          </div>
          <div className="score-item">
            <span className="player-label">Ties</span>
            <span className="score">{pvpScores.ties}</span>
          </div>
          <button className="reset-scoreboard-button" onClick={resetScoreboard}>
            Reset Scores
          </button>
        </div>
      )}

      {/* Shape Selector - Only in AI mode */}
      {gameMode === "ai" && (
        <div className="shape-selector">
          <label htmlFor="shape-select">Choose your shape: </label>
          <select
            value={playerShape}
            onChange={(e) => setPlayerShape(e.target.value)}
            disabled={status !== 'ongoing' || board.flat().some(cell => cell !== "")}
          >
            <option value="X">X</option>
            <option value="O">O</option>
            <option value="◼">Square</option>
            <option value="🔺">Triangle</option>
          </select>
        </div>
      )}

      {/* Game Board */}
      <h1>Tic Tac Toe - {gameMode === "ai" ? "vs AI" : "PvP Mode"}</h1>
      
      {/* Show current player in PvP mode */}
      {gameMode === "pvp" && status === "ongoing" && (
        <div className="current-player">
          Current Turn: {currentPlayer === "X" ? playerName : player2Name} ({currentPlayer})
        </div>
      )}
      
      {/* Show current player in AI mode */}
      {gameMode === "ai" && status === "ongoing" && (
        <div className="current-player">
          Current Turn: {currentPlayer === playerShape ? playerName : "AI"} ({currentPlayer})
        </div>
      )}
      
      <div className="board">
        {board.map((row, i) => (
          <div className="board-row" key={i}>
            {row.map((_, j) => (
              <Fragment key={j}>{renderCell(i, j)}</Fragment>
            ))}
          </div>
        ))}
      </div>

      {/* Status and Game Controls */}
      <div className="status-text">Status: {status}</div>
      {status !== "ongoing" ? (
        <button className="replay-button" onClick={resetGame}>
          Play Again
        </button>
      ) : (
        <button className="end-round-button" onClick={resetGame}>
          End Round
        </button>
      )}

      {/* Player Name Modal */}
      <PlayerName
        isOpen={isNameOpen}
        onClose={() => setIsNameOpen(false)}
        onSave={handleSavePlayerName}
        savedName={playerName}
        title={gameMode === "pvp" ? "Enter Player 1 Name" : "Enter Your Name"}
      />
      
      {/* Player 2 Name Modal (PvP mode only) */}
      <PlayerName
        isOpen={isPlayer2NameOpen}
        onClose={() => setIsPlayer2NameOpen(false)}
        onSave={handleSavePlayer2Name}
        savedName={player2Name}
        title="Enter Player 2 Name"
      />
    </div>
  );
}

export default TicTacToe;
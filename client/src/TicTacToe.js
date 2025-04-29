import "./App.css";
import { useState, useEffect, Fragment, useCallback } from "react";
import PlayerName from "./PlayerName";
import { playSound } from './PlaySound';

function TicTacToe() {
  // ===== STATE MANAGEMENT =====
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("default");

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
  const aiShape = playerShape === "X" ? "O" :
    playerShape === "O" ? "X" :
      playerShape === "◼" ? "🔺" : "◼";
  const [player2Shape, setPlayer2Shape] = useState("O");

  // Player info
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ticTacToePlayerName') || '';
  });
  const [player2Name, setPlayer2Name] = useState(() => {
    return localStorage.getItem('ticTacToePlayer2Name') || 'Player 2';
  });
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState("player1");

  // AI Mode Scores
  const [aiModeScores, setAiModeScores] = useState(() => {
    const savedScores = localStorage.getItem('ticTacToeAiScores');
    return savedScores ? JSON.parse(savedScores) : { X: 0, O: 0, "◼": 0, "🔺": 0, Ties: 0 };
  });

  // PvP Scores - completely separate from AI scores
  const [pvpScores, setPvpScores] = useState(() => {
    const savedPvpScores = localStorage.getItem('ticTacToePvpScores');
    return savedPvpScores ? JSON.parse(savedPvpScores) : {
      player1: 0,
      player2: 0,
      ties: 0
    };
  });

  // ===== THEME MANAGEMENT =====
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

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
    if (gameMode === "pvp" || !playerName) return; // Skip in PvP mode completely

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
    if (!gameId || gameMode === "pvp") return; // No move logging for PvP mode

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

        // Ensure AI uses its proper shape
        if (moveRow !== -1 && moveCol !== -1) {
          // Create a new board and set the AI's move with the correct shape
          const newBoard = board.map(row => [...row]);
          newBoard[moveRow][moveCol] = aiShape;

          logMove(aiShape, moveRow, moveCol);
          playSound('/sound/bubble-pop-2-293341.mp3');
          setBoard(newBoard);

          // After AI moves, it's player's turn
          // Since currentPlayer is "X"/"O" based, we need to maintain that logic
          setCurrentPlayer("X"); // Always set to X after AI's turn
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
  }, [board, gameMode, logMove, aiShape]);

  // ===== UI HANDLERS =====
  const handleCellClick = useCallback((row, col) => {
    // Handle unset player name based on game mode
    if (gameMode === "ai" && !playerName) {
      setEditingPlayer("player1");
      setIsNameOpen(true);
      return;
    } else if (gameMode === "pvp") {
      // In PvP mode, check which player's name is missing
      if (currentPlayer === "X" && !playerName) {
        setEditingPlayer("player1");
        setIsNameOpen(true);
        return;
      } else if (currentPlayer === "O" && !player2Name) {
        setEditingPlayer("player2");
        setIsNameOpen(true);
        return;
      }
    }

    // PvP mode allows both shapes to be played by users
    if (gameMode === "pvp") {
      if (board[row][col] === "" && status === "ongoing" && !loading) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer === "X" ? playerShape : player2Shape;
        setBoard(newBoard);
        playSound('/sound/select-sound-121244.mp3');
        // Toggle player
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
      return;
    }

    // AI mode - user can only play as their chosen shape
    // Only allow player to move when it's their turn and cell is empty
    if (board[row][col] === "" && status === "ongoing" && !loading) {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = playerShape;
      setBoard(newBoard);
      playSound('/sound/select-sound-121244.mp3');

      // After player moves, it's AI's turn
      setCurrentPlayer("O");

      const result = checkGameStatus();
      logMove(playerShape, row, col, result);
    }
  }, [playerName, player2Name, board, currentPlayer, status, loading, gameMode, playerShape, player2Shape, checkGameStatus, logMove]);

  const handleSavePlayerName = useCallback((name) => {
    const validName = name.trim() ? name : 'Guest Player';

    if (editingPlayer === "player1") {
      setPlayerName(validName);
      localStorage.setItem('ticTacToePlayerName', validName);
      if (gameMode === "ai") {
        createPlayerInDatabase(validName);
      }
    } else if (editingPlayer === "player2") {
      setPlayer2Name(validName);
      localStorage.setItem('ticTacToePlayer2Name', validName);
    }
  }, [createPlayerInDatabase, gameMode, editingPlayer]);

  const resetGame = useCallback(() => {
    setBoard([["", "", ""], ["", "", ""], ["", "", ""]]);
    setCurrentPlayer("X");
    setStatus("ongoing");
    setGameId(generateGameId());
  }, [generateGameId]);

  const resetScoreboard = useCallback(() => {
    if (gameMode === "pvp") {
      // Reset only PvP scores
      setPvpScores({ player1: 0, player2: 0, ties: 0 });
      localStorage.removeItem('ticTacToePvpScores');
    } else {
      // Reset only AI mode scores
      setAiModeScores({ X: 0, O: 0, "◼": 0, "🔺": 0, Ties: 0 });
      localStorage.removeItem('ticTacToeAiScores');
    }
  }, [gameMode]);

  const setGameModeAI = useCallback(() => {
    setGameMode("ai");
    resetGame();
  }, [resetGame]);

  const setGameModePvP = useCallback(() => {
    setGameMode("pvp");
    resetGame();
  }, [resetGame]);

  const changePlayerName = useCallback((player) => {
    setEditingPlayer(player);
    setIsNameOpen(true);
  }, []);

  // ===== EFFECTS =====
  // Initialize a new game with a unique ID
  useEffect(() => {
    setGameId(generateGameId());
  }, [generateGameId]);

  // Save AI mode scores to localStorage
  useEffect(() => {
    localStorage.setItem('ticTacToeAiScores', JSON.stringify(aiModeScores));
  }, [aiModeScores]);

  // Save PvP scores to localStorage - separate from AI scores
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

  // Check if player name exists for AI mode only
  useEffect(() => {
    if (gameMode === "ai") {
      if (!playerName) {
        setEditingPlayer("player1");
        setIsNameOpen(true);
      } else {
        createPlayerInDatabase(playerName);
      }
    }
  }, [playerName, gameMode, createPlayerInDatabase]);

  // Trigger AI move when it's AI's turn in AI mode
  useEffect(() => {
    if (gameMode === "ai" && currentPlayer === "O" && status === 'ongoing') {
      const result = checkGameStatus();
      if (result === null) {
        // AI should make a move only if game is not already won
        makeAIMove();
      }
    }
  }, [currentPlayer, status, gameMode, makeAIMove, checkGameStatus]);

  // Process the game result when board changes - keeping PvP and AI mode separate
  useEffect(() => {
    const result = checkGameStatus();
    if (result && status === "ongoing") {
      let soundToPlay = "";

      if (gameMode === "pvp") {
        // PvP mode score tracking - completely separate from AI mode
        const newPvpScores = { ...pvpScores };
        let newStatus = "";

        if (result === playerShape) {
          newStatus = `${playerName} wins`;
          newPvpScores.player1 += 1;
          soundToPlay = '/sound/success_bell-6776.mp3';
        } else if (result === player2Shape) {
          newStatus = `${player2Name} wins`;
          newPvpScores.player2 += 1;
          soundToPlay = '/sound/achievement-video-game-type-1-230515.mp3';
        } else if (result === 'Tie') {
          newStatus = "It's a tie";
          newPvpScores.ties += 1;
          soundToPlay = '/sound/080205_life-lost-game-over-89697.mp3';
        }

        setPvpScores(newPvpScores);
        setStatus(newStatus);
        // No leaderboard update for PvP mode
      } else {
        // AI mode score tracking - completely separate from PvP mode
        let newAiScores = { ...aiModeScores };
        let newStatus = "";

        if (result === playerShape) {
          newStatus = `${playerName} wins`;
          newAiScores[playerShape] = (newAiScores[playerShape] || 0) + 1;
          updateLeaderboard('win'); // Only update leaderboard in AI mode
          soundToPlay = '/sound/success_bell-6776.mp3';
        } else if (result === aiShape) {
          newStatus = `AI wins`;
          newAiScores[aiShape] = (newAiScores[aiShape] || 0) + 1;
          updateLeaderboard('loss'); // Only update leaderboard in AI mode
          soundToPlay = '/sound/080205_life-lost-game-over-89697.mp3';
        } else if (result === 'Tie') {
          newStatus = "It's a tie";
          newAiScores.Ties += 1;
          updateLeaderboard('tie'); // Only update leaderboard in AI mode
          soundToPlay = '/sound/achievement-video-game-type-1-230515.mp3';
        }

        setAiModeScores(newAiScores);
        setStatus(newStatus);
      }

      if (soundToPlay) {
        playSound(soundToPlay);
      }
    }
  }, [board, status, aiModeScores, pvpScores, gameMode, playerName, player2Name, playerShape, player2Shape, aiShape, checkGameStatus, updateLeaderboard]);

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
        disabled={gameMode === "ai" ? (currentPlayer !== "X" || loading || status !== 'ongoing') : (loading || status !== 'ongoing')}
        className="cell-button">
        {renderShape(board[row][col])}
      </button>
    );
  };

  // Determine which player's turn to display
  const getCurrentPlayerDisplay = () => {
    if (gameMode === "pvp") {
      return `Current Turn: ${currentPlayer === "X" ? playerName : player2Name} (${currentPlayer === "X" ? playerShape : player2Shape})`;
    } else {
      return `Current Turn: ${currentPlayer === "X" ? playerName : "AI"} (${currentPlayer === "X" ? playerShape : aiShape})`;
    }
  };

  // ===== COMPONENT RENDER =====
  return (
    <main>
      <div className="board-container">
        <h1>Tic Tac Toe</h1>

        {/* Game Mode Toggle */}
        <div className="game-mode-selector">
          <button
            className={`mode-button ${gameMode === "ai" ? "active-mode" : ""}`}
            onClick={setGameModeAI}
            disabled={status !== 'ongoing' || board.flat().some(cell => cell !== "")}
          >
            <i className="ri-robot-line"></i> Player vs AI
          </button>
          <button
            className={`mode-button ${gameMode === "pvp" ? "active-mode" : ""}`}
            onClick={setGameModePvP}
            disabled={status !== 'ongoing' || board.flat().some(cell => cell !== "")}
          >
            <i className="ri-user-line"></i> Player vs Player
          </button>
        </div>

        {/* Scoreboard - Different display based on game mode */}
        {gameMode === "ai" ? (
          <div className="scoreboard">
            <div className="score-item">
              <div className="player-label-container">
                <span className="player-label">
                  {playerName || 'Player'} ({playerShape})
                </span>
                <button
                  className="edit-icon"
                  onClick={() => changePlayerName("player1")}
                  aria-label="Edit player name"
                >
                  <i className="ri-pencil-line"></i>
                </button>
              </div>
              <span className="score">{aiModeScores[playerShape] || 0}</span>
            </div>
            <div className="score-item">
              <span className="player-label">AI ({aiShape})</span>
              <span className="score">{aiModeScores[aiShape] || 0}</span>
            </div>
            <div className="score-item">
              <span className="player-label">Ties</span>
              <span className="score">{aiModeScores.Ties}</span>
            </div>
            <button className="reset-scoreboard-button" onClick={resetScoreboard}>
              Reset Scores
            </button>
          </div>
        ) : (
          <div className="scoreboard">
            <div className="score-item">
              <div className="player-label-container">
                <span className="player-label">
                  {playerName || 'Player 1'} ({playerShape})
                </span>
                <button
                  className="edit-icon"
                  onClick={() => changePlayerName("player1")}
                  aria-label="Edit player 1 name"
                >
                  <i className="ri-pencil-line"></i>
                </button>
              </div>
              <span className="score">{pvpScores.player1}</span>
            </div>
            <div className="score-item">
              <div className="player-label-container">
                <span className="player-label">
                  {player2Name} ({player2Shape})
                </span>
                <button
                  className="edit-icon"
                  onClick={() => changePlayerName("player2")}
                  aria-label="Edit player 2 name"
                >
                  <i className="ri-pencil-line"></i>
                </button>
              </div>
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

        {/* Shape selectors */}
        <div className="shape-selector">
          <div className="shape-select-container">
            <label htmlFor="shape-select">
              {playerName ? `${playerName}'s shape:` : 'Choose your shape:'}
            </label>
            <div className="custom-select">
              <select
                id="shape-select"
                value={playerShape}
                onChange={(e) => setPlayerShape(e.target.value)}
                disabled={status !== 'ongoing' || board.flat().some(cell => cell !== "")}
                className="shape-select"
              >
                <option value="X">X</option>
                <option value="O">O</option>
                <option value="◼">Square</option>
                <option value="🔺">Triangle</option>
              </select>
              <div className="select-arrow">▼</div>
            </div>
          </div>

          {gameMode === "pvp" && (
            <div className="shape-select-container">
              <label htmlFor="shape2-select">
                {player2Name !== "Player 2" ? `${player2Name}'s shape:` : 'Player 2 shape:'}
              </label>
              <div className="custom-select">
                <select
                  id="shape2-select"
                  value={player2Shape}
                  onChange={(e) => setPlayer2Shape(e.target.value)}
                  disabled={status !== 'ongoing' || board.flat().some(cell => cell !== "")}
                  className="shape-select"
                >
                  {["X", "O", "◼", "🔺"].filter(shape => shape !== playerShape).map((shape) => (
                    <option key={shape} value={shape}>
                      {shape}
                    </option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>
          )}
        </div>

        {/* Game board */}
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
        <div className="status-text">
          {status === "ongoing" ? getCurrentPlayerDisplay() : `Status: ${status}`}
        </div>
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
          savedName={editingPlayer === "player1" ? playerName : player2Name}
          title={
            editingPlayer === "player1"
              ? (gameMode === "pvp" ? "Enter Player 1 Name" : "Enter Your Name")
              : "Enter Player 2 Name"
          }
        />
      </div>
    </main>
  );
}

export default TicTacToe;
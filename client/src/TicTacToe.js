import "./App.css";
import { useState, useEffect, Fragment, useCallback } from "react";
import PlayerName from "./PlayerName";

function TicTacToe() {
  // Local game scores
  const [scores, setScores] = useState(() => {
    const savedScores = localStorage.getItem('ticTacToeScores');
    return savedScores 
      ? JSON.parse(savedScores) 
      : { X: 0, O: 0, Ties: 0 };
  });

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
  
  // Player name handling
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ticTacToePlayerName') || '';
  });
  const [isNameOpen, setIsNameOpen] = useState(false);

  // Generate a new game ID when starting a new game
  const generateGameId = useCallback(() => {
    return Date.now().toString();
  }, []);

  // Initialize a new game with a unique ID
  useEffect(() => {
    setGameId(generateGameId());
  }, [generateGameId]); // Include generateGameId in the dependency array

  const checkGameStatus = useCallback(() => {
    // Rows
    for (let i = 0; i < 3; i++) {
      if (
        board[i][0] === board[i][1] &&
        board[i][1] === board[i][2] &&
        board[i][0] !== ""
      ) {
        return board[i][0];
      }
    }

    // Columns
    for (let i = 0; i < 3; i++) {
      if (
        board[0][i] === board[1][i] &&
        board[1][i] === board[2][i] &&
        board[0][i] !== ""
      ) {
        return board[0][i];
      }
    }

    // Diagonals
    if (
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2] &&
      board[0][0] !== ""
    ) {
      return board[0][0];
    }

    if (
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0] &&
      board[0][2] !== ""
    ) {
      return board[0][2];
    }

    // Tie
    if (!board.some(row => row.includes(""))) {
      return "Tie";
    }

    return null;
  }, [board]);

  // Update leaderboard with game result
  const updateLeaderboard = useCallback((result) => {
    // Skip if no player name
    if (!playerName) return;
    
    const dbPlayerName = playerName.trim() || 'Guest Player';
    console.log(`Updating leaderboard for ${dbPlayerName} with result: ${result}`);

    // Ensure player exists first
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
      
      // Now update the player's stats
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
    let aiResult = 'tie';
    if (result === 'win') aiResult = 'loss';
    if (result === 'loss') aiResult = 'win';
    
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
  }, [playerName]);

  const handleSavePlayerName = (name) => {
    // Ensure we have a valid name
    const validName = name.trim() ? name : 'Guest Player';
    setPlayerName(validName);
    localStorage.setItem('ticTacToePlayerName', validName);
    
    // Create player entry in database when name is set
    fetch('http://localhost:3001/api/player/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName: validName
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Player created or found:', data);
    })
    .catch(error => {
      console.error('Error creating player:', error);
    });
  };

  const logMove = useCallback((player, row, col, gameResult = null) => {
    if (!gameId) return;
    
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
  }, [status, gameId]);

  const makeAIMove = useCallback(() => {
    setLoading(true);
    
    // Create a JSON string of the current board state
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
        
        // Parse the AI response
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
        
        if (moveRow !== -1 && moveCol !== -1) {
          logMove('O', moveRow, moveCol);
        } else {
          console.warn("Could not detect AI move in response");
        }
        
        // Update the board with AI's move
        setBoard(aiBoard);
        setCurrentPlayer("X");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error with AI move:", error);
        setLoading(false);
        // Maybe show an error to the user
        alert("There was an error with the AI's move. Please try again.");
      });
  }, [board, logMove]);

  useEffect(() => {
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem('ticTacToePlayerName', playerName);
  }, [playerName]);

  // Check if player name exists, otherwise prompt
  useEffect(() => {
    if (!playerName) {
      setIsNameOpen(true);
    } else {
      // Create player in database when component loads with existing name
      fetch('http://localhost:3001/api/player/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Player created or found on load:', data);
      })
      .catch(error => {
        console.error('Error creating player on load:', error);
      });
    }
  }, [playerName]);

  useEffect(() => {
    if (currentPlayer === "O" && status === 'ongoing') {
      makeAIMove();
    }
  }, [currentPlayer, status, makeAIMove]);

  useEffect(() => {
    const result = checkGameStatus();

    if (result && status === "ongoing") {
      let newScores = { ...scores };
      let newStatus = "";

      if (result === 'X') {
        newStatus = 'X wins';
        newScores.X += 1;
        // Update leaderboard - human won
        updateLeaderboard('win');
      } else if (result === 'O') {
        newStatus = 'O wins';
        newScores.O += 1;
        // Update leaderboard - human lost
        updateLeaderboard('loss');
      } else if (result === 'Tie') {
        newStatus = "It's a tie";
        newScores.Ties += 1;
        // Update leaderboard - tie
        updateLeaderboard('tie');
      }

      setScores(newScores);
      setStatus(newStatus);
    }
  }, [board, status, scores, checkGameStatus, updateLeaderboard]);


  const handleCellClick = (row, col) => {
    // Prompt for name if not set
    if (!playerName) {
      setIsNameOpen(true);
      return;
    }
    
    if (board[row][col] === "" &&
      currentPlayer === "X" &&
      status === "ongoing"
    ) {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = "X";
      setBoard(newBoard);
      setCurrentPlayer("O");

      const result = checkGameStatus(); // Get current result in case it's the last move
      logMove('X', row, col, result);
    }
  };

  const renderShape = (value) => {
    switch (value) {
      case 'X': // square
        return <div style={{ width: 32, height: 32, backgroundColor: '#333' }} />;
      case 'O': // oval
        return <div style={{ width: 40, height: 25, backgroundColor: '#333', borderRadius: '50%' }} />;
      case '★': // star
        return <span style={{ fontSize: '28px', color: '#f0a500' }}>★</span>;
      default:
        return null;
    }
  };
  

  const renderCell = (row, col) => {
    return (
      <button
        onClick={() => handleCellClick(row, col)}
        disabled={loading || status !== 'ongoing'}
        className="cell-button">
        {board[row][col]}
      </button>
    );
  };

  const resetGame = () => {
    setBoard([
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ]);
    setCurrentPlayer("X");
    setStatus("ongoing");
    // Generate a new game ID for the new game
    setGameId(generateGameId());
  };

  const resetScoreboard = () => {
    setScores({ X: 0, O: 0, Ties: 0 });
    localStorage.removeItem('ticTacToeScores');
  };

  const changePlayerName = () => {
    setIsNameOpen(true);
  };

  return (
    <div className="board-container">
      <div className="player-info">
        <div className="player-name-display">
          <span>Player: {playerName || 'Guest'}</span>
          <button className="change-name-button" onClick={changePlayerName}>
            Change Name
          </button>
        </div>
      </div>

      <div className="scoreboard">
        <div className="score-item">
          <span className="player-label">{playerName || 'Player'} (X)</span>
          <span className="score">{scores.X}</span>
        </div>
        <div className="score-item">
          <span className="player-label">AI (O)</span>
          <span className="score">{scores.O}</span>
        </div>
        <div className="score-item">
          <span className="player-label">Ties</span>
          <span className="score">{scores.Ties}</span>
        </div>
        <button 
          className="reset-scoreboard-button"
          onClick={resetScoreboard}
        >
          Reset Scores
        </button>
      </div>

      <h1>Tic Tac Toe</h1>
      <div className="board">
        {board.map((row, i) => (
          <div className="board-row" key={i}>
            {row.map((_, j) => (
              <Fragment key={j}>{renderCell(i, j)}</Fragment>
            ))}
          </div>
        ))}
      </div>
      <div className="status-text">Status: {status}</div>

      {status !== "ongoing" && (
        <button
          className="replay-button"
          onClick={resetGame}
        >
          Play Again
        </button>
      )}

      {/* Player Name Modal */}
      <PlayerName
        isOpen={isNameOpen}
        onClose={() => setIsNameOpen(false)}
        onSave={handleSavePlayerName}
        savedName={playerName}
      />
    </div>
  );
}

export default TicTacToe;
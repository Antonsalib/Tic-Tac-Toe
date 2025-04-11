import "./App.css";
import IntData from "./Int";
import { useState, useEffect, Fragment } from "react";

function TicTacToe() {
  const [scores, setScores] = useState(() => {
    const savedScores = localStorage.getItem('ticTacToeScores');
    return savedScores 
      ? JSON.parse(savedScores) 
      : { X: 0, O: 0, Ties: 0 };
  });

  const [board, setBoard] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [status, setStatus] = useState("ongoing");
  const [loading, setLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    if (currentPlayer === "O" && status === 'ongoing') {
      makeAIMove();
    }
  }, [currentPlayer, status]);

  const checkGameStatus = () => {
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
  };

  useEffect(() => {
    const result = checkGameStatus();

    if (result && status === "ongoing") {
      let newScores = { ...scores };
      let newStatus = "";

      if (result === 'X') {
        newStatus = 'X wins';
        newScores.X += 1;
      } else if (result === 'O') {
        newStatus = 'O wins';
        newScores.O += 1;
      } else if (result === 'Tie') {
        newStatus = "It's a tie";
        newScores.Ties += 1;
      }

      setScores(newScores);
      setStatus(newStatus);
    }
  }, [board, status]);

  const logMove = (player, row, col, gameResult = null) => {
    setMoveLoading(true);
    fetch('http://localhost:3001/api/int', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
    })
    .finally(() => {
      setMoveLoading(false);
    });
  };

  const makeAIMove = () => {
    setLoading(true);
    fetch(`http://localhost:3001/api/game?board=${encodeURIComponent(
      JSON.stringify(board)
    )}`).then((res) => res.json())
      .then((data) => {
        const aiBoard = JSON.parse(data.aiResponse).board;

        outer: for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (aiBoard[i][j] !== board[i][j]) {
              logMove('O', i, j);
              break outer;
            }
          }
        }

        setBoard(aiBoard);
        setCurrentPlayer("X");
        setLoading(false);
      }).catch((error) => {
        console.error("Error fetching AI move:", error);
        setLoading(false);
      });
  };

  const handleCellClick = (row, col) => {
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
  };

  const resetScoreboard = () => {
    setScores({ X: 0, O: 0, Ties: 0 });
    localStorage.removeItem('ticTacToeScores');
  };

  return (
    <div className="board-container">
      <div className="scoreboard">
        <div className="score-item">
          <span className="player-label">Player (X)</span>
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

      <h1 className="text-4xl font-bold mb-8">Tic Tac Toe</h1>
      <div className="flex flex-col gap-1">
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
          Replay
        </button>
      )}

      <IntData 
        board={board} 
        status={status} 
        scores={scores} 
      />
    </div>
  );
}

export default TicTacToe;

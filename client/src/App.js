import "./App.css";
import { useState, useEffect, Fragment } from "react";

function App() {
  const [board, setBoard] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [status, setStatus] = useState("ongoing");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentPlayer === "O" && status === 'ongoing') {
      makeAIMove();
    }
  }, [currentPlayer, status]);

  useEffect(() => {
    checkGameStatus();
  }, [board]);

  const makeAIMove = () => {
    setLoading(true);
    fetch(`http://localhost:3001/api/game?board=${encodeURIComponent(
      JSON.stringify(board)
    )}`).then((res) => res.json())
      .then((data) => {
        setBoard(JSON.parse(data.aiResponse).board);
        setCurrentPlayer("X");
        setLoading(false);
      }).catch((error) => {
        console.error("Error fetching AI text:", error);
        setLoading(false);
      });
  };

  const checkGameStatus = () => {
    for (let i = 0; i < 3; i++) {
      if (
        board[i][0] === board[i][1] &&
        board[i][1] === board[i][2] &&
        board[i][0] !== ""
      ) {
        setStatus(`${board[i][0]} wins`);
        return;
      }

      if (
        board[0][i] === board[1][i] &&
        board[1][i] === board[2][i] &&
        board[0][i] !== ""
      ) {
        setStatus(`${board[0][i]} wins`);
        return;
      }
    }

    if (
      (board[0][0] === board[1][1] &&
        board[1][1] === board[2][2] &&
        board[0][0] !== "") ||
      (board[0][2] === board[1][1] &&
        board[1][1] === board[2][0] &&
        board[0][2] !== "")
    ) {
      setStatus(`${board[1][1]} wins`);
      return;
    }

    // If the board is full and no one has won, it's a tie
    if (!board.some(row => row.includes(""))) {
      setStatus("It's a tie");
    }
  };

  const handleCellClick = (row, col) => {
    if (board[row][col] === "" &&
      currentPlayer === "X" &&
      status === "ongoing"
    ) {
      board[row][col] = "X";
      setBoard([...board]);
      setCurrentPlayer("O");
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

  return (
    <div className="board-container">
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
      <div className="status-text">{status}!</div>
      {/* Show replay button if game is over */}
      {status !== "ongoing" && (
        <button
          className="replay-button"
          onClick={resetGame}
        >
          
          Replay
        </button>
      )}
    </div>
  );
}

export default App;

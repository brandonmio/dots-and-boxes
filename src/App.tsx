import { useState, useCallback, useEffect } from "react";
import { getBestMove } from "./ai";
import type { GameState } from "./ai";
import type { CSSProperties } from "react";

type Player = "blue" | "red";
type Winner = Player | "tie" | null;
type Hover = { type: "h" | "v"; r: number; c: number } | null;

const COLS = 3;
const ROWS = 3;
const PAD = 50;
const STEP = 90;

function makeGrid<T>(rows: number, cols: number, val: T | null = null): (T | null)[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(val));
}

export default function App() {
  const [turn, setTurn] = useState<Player>("blue");
  const [hLines, setHLines] = useState(() => makeGrid<Player | null>(ROWS + 1, COLS));
  const [vLines, setVLines] = useState(() => makeGrid<Player | null>(ROWS, COLS + 1));
  const [boxes, setBoxes] = useState(() => makeGrid<Player | null>(ROWS, COLS));
  const [scores, setScores] = useState({ blue: 0, red: 0 });
  const [hover, setHover] = useState<Hover>(null);
  const [winner, setWinner] = useState<Winner>(null);

  const playerColor = (p: Player) => (p === "blue" ? "#378ADD" : "#E24B4A");

  const resetGame = () => {
    setTurn("blue");
    setHLines(makeGrid(ROWS + 1, COLS));
    setVLines(makeGrid(ROWS, COLS + 1));
    setBoxes(makeGrid(ROWS, COLS));
    setScores({ blue: 0, red: 0 });
    setHover(null);
    setWinner(null);
  };

  const handleClick = useCallback(
    (type: "h" | "v", r: number, c: number) => {
      if (winner) return;

      const newH = hLines.map((row) => [...row]);
      const newV = vLines.map((row) => [...row]);

      if (type === "h") {
        if (newH[r][c]) return;
        newH[r][c] = turn;
      } else {
        if (newV[r][c]) return;
        newV[r][c] = turn;
      }

      const newBoxes = boxes.map((row) => [...row]);
      const newScores = { ...scores };
      let captured = false;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (newBoxes[r][c]) continue;

          if (
            newH[r][c] &&
            newH[r + 1][c] &&
            newV[r][c] &&
            newV[r][c + 1]
          ) {
            newBoxes[r][c] = turn;

            if (turn === "blue") newScores.blue++;
            else newScores.red++;

            captured = true;
          }
        }
      }

      setHLines(newH);
      setVLines(newV);
      setBoxes(newBoxes);
      setScores(newScores);

      const total = ROWS * COLS;

      if (newScores.blue + newScores.red === total) {
        if (newScores.blue > newScores.red) setWinner("blue");
        else if (newScores.red > newScores.blue) setWinner("red");
        else setWinner("tie");
      } else if (!captured) {
        setTurn(turn === "blue" ? "red" : "blue");
      }
    },
    [turn, hLines, vLines, boxes, scores, winner]
  );

  useEffect(() => {
    if (turn === "red" && !winner) {
      const state: GameState = {
        hLines,
        vLines,
        boxes,
        scores,
        turn,
      };

      const move = getBestMove(state, 3);

      if (move) {
        setTimeout(() => {
          handleClick(move.type, move.r, move.c);
        }, 200);
      }
    }
  }, [turn, hLines, vLines, boxes, scores, winner, handleClick]);

  const svgW = PAD * 2 + STEP * COLS;
  const svgH = PAD * 2 + STEP * ROWS;

  const styles: Record<string, CSSProperties> = {
    page: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f5f3",
      fontFamily: "Georgia, serif",
    },
    card: {
      background: "#fff",
      padding: "2rem",
      borderRadius: 20,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1rem",
    },
    title: {
      fontSize: 28,
      fontWeight: 700,
      margin: 0,
    },
    svg: {
      display: "block",
    },
    scoreBar: {
      display: "flex",
      gap: 16,
      alignItems: "center",
    },
    badge: {
      padding: "6px 12px",
      borderRadius: 10,
      border: "1px solid #ddd",
      display: "flex",
      gap: 6,
      alignItems: "center",
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: "50%",
    },
    turn: {
      fontSize: 14,
    },
    winner: {
      fontSize: 18,
      fontWeight: 600,
    },
    button: {
      padding: "8px 16px",
      borderRadius: 8,
      border: "1px solid #ccc",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Dots & Boxes</h1>

        <div style={styles.scoreBar}>
          <div style={styles.badge}>
            <div style={{ ...styles.dot, background: "#378ADD" }} />
            {scores.blue}
          </div>

          <div style={styles.badge}>
            <div style={{ ...styles.dot, background: "#E24B4A" }} />
            {scores.red}
          </div>
        </div>

        <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={styles.svg}>
          {/* Horizontal lines */}
          {hLines.map((row, r) =>
            row.map((owner, c) => {
              const hovered =
                hover?.type === "h" && hover.r === r && hover.c === c;

              return (
                <line
                  key={`h-${r}-${c}`}
                  x1={PAD + c * STEP}
                  y1={PAD + r * STEP}
                  x2={PAD + (c + 1) * STEP}
                  y2={PAD + r * STEP}
                  stroke={
                    owner
                      ? playerColor(owner)
                      : hovered
                      ? playerColor(turn)
                      : "transparent"
                  }
                  strokeWidth={4}
                  opacity={owner ? 1 : hovered ? 0.4 : 0}
                  onClick={() => handleClick("h", r, c)}
                  onMouseEnter={() => setHover({ type: "h", r, c })}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            })
          )}

          {/* Vertical lines */}
          {vLines.map((row, r) =>
            row.map((owner, c) => {
              const hovered =
                hover?.type === "v" && hover.r === r && hover.c === c;

              return (
                <line
                  key={`v-${r}-${c}`}
                  x1={PAD + c * STEP}
                  y1={PAD + r * STEP}
                  x2={PAD + c * STEP}
                  y2={PAD + (r + 1) * STEP}
                  stroke={
                    owner
                      ? playerColor(owner)
                      : hovered
                      ? playerColor(turn)
                      : "transparent"
                  }
                  strokeWidth={4}
                  opacity={owner ? 1 : hovered ? 0.4 : 0}
                  onClick={() => handleClick("v", r, c)}
                  onMouseEnter={() => setHover({ type: "v", r, c })}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            })
          )}

          {/* Dots */}
          {Array.from({ length: ROWS + 1 }, (_, r) =>
            Array.from({ length: COLS + 1 }, (_, c) => (
              <circle
                key={`d-${r}-${c}`}
                cx={PAD + c * STEP}
                cy={PAD + r * STEP}
                r={6}
                fill="#222"
              />
            ))
          )}
        </svg>

        {winner && (
          <div style={styles.winner}>
            {winner === "tie" ? "Tie!" : `${winner} wins!`}
          </div>
        )}

        {!winner && <div style={styles.turn}>Turn: {turn}</div>}

        <button style={styles.button} onClick={resetGame}>
          Reset
        </button>
      </div>
    </div>
  );
}
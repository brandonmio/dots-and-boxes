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

const BLUE = "#378ADD";
const RED = "#E24B4A";

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

  const playerColor = (p: Player) => (p === "blue" ? BLUE : RED);

  const reset = () => {
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
        }, 150);
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
    btn: {
      padding: "8px 16px",
      borderRadius: 8,
      border: "1px solid #ccc",
      cursor: "pointer",
      background: "white",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Dots & Boxes</h1>

        {/* SCORE */}
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            🔵 {scores.blue}
          </div>
          <div>
            🔴 {scores.red}
          </div>
        </div>

        {/* BOARD */}
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          
          {/* BOXES */}
          {boxes.map((row, r) =>
            row.map((owner, c) =>
              owner ? (
                <rect
                  key={`b-${r}-${c}`}
                  x={PAD + c * STEP + 10}
                  y={PAD + r * STEP + 10}
                  width={STEP - 20}
                  height={STEP - 20}
                  rx={6}
                  fill={owner === "blue" ? BLUE : RED}
                  opacity={0.25}
                />
              ) : null
            )
          )}

          {/* HORIZONTAL LINES */}
          {hLines.map((row, r) =>
            row.map((owner, c) => {
              const hoverOn =
                hover?.type === "h" && hover.r === r && hover.c === c;

              return (
                <g key={`h-${r}-${c}`}>
                  {!owner && hoverOn && (
                    <line
                      x1={PAD + c * STEP}
                      y1={PAD + r * STEP}
                      x2={PAD + (c + 1) * STEP}
                      y2={PAD + r * STEP}
                      stroke="#aaa"
                      strokeWidth={6}
                      opacity={0.4}
                    />
                  )}

                  {!owner && (
                    <line
                      x1={PAD + c * STEP}
                      y1={PAD + r * STEP}
                      x2={PAD + (c + 1) * STEP}
                      y2={PAD + r * STEP}
                      stroke="transparent"
                      strokeWidth={28}
                      onClick={() => handleClick("h", r, c)}
                      onMouseEnter={() => setHover({ type: "h", r, c })}
                      onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer" }}
                    />
                  )}

                  {owner && (
                    <line
                      x1={PAD + c * STEP}
                      y1={PAD + r * STEP}
                      x2={PAD + (c + 1) * STEP}
                      y2={PAD + r * STEP}
                      stroke={playerColor(owner)}
                      strokeWidth={5}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* VERTICAL LINES */}
          {vLines.map((row, r) =>
            row.map((owner, c) => {
              const hoverOn =
                hover?.type === "v" && hover.r === r && hover.c === c;

              return (
                <g key={`v-${r}-${c}`}>
                  {!owner && hoverOn && (
                    <line
                      x1={PAD + c * STEP}
                      y1={PAD + r * STEP}
                      x2={PAD + c * STEP}
                      y2={PAD + (r + 1) * STEP}
                      stroke="#aaa"
                      strokeWidth={6}
                      opacity={0.4}
                    />
                  )}

                  {!owner && (
                    <line
                      x1={PAD + c * STEP}
                      y1={PAD + r * STEP}
                      x2={PAD + c * STEP}
                      y2={PAD + (r + 1) * STEP}
                      stroke="transparent"
                      strokeWidth={28}
                      onClick={() => handleClick("v", r, c)}
                      onMouseEnter={() => setHover({ type: "v", r, c })}
                      onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer" }}
                    />
                  )}

                  {owner && (
                    <line
                      x1={PAD + c * STEP}
                      y1={PAD + r * STEP}
                      x2={PAD + c * STEP}
                      y2={PAD + (r + 1) * STEP}
                      stroke={playerColor(owner)}
                      strokeWidth={5}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* DOTS */}
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

        {/* STATUS */}
        {winner && (
          <div>
            {winner === "tie" ? "Tie!" : `${winner} wins!`}
          </div>
        )}

        {!winner && <div>Turn: {turn}</div>}

        <button style={styles.btn} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
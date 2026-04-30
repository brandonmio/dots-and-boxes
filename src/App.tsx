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

  const initGame = () => {
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

      for (let br = 0; br < ROWS; br++) {
        for (let bc = 0; bc < COLS; bc++) {
          if (newBoxes[br][bc]) continue;

          if (
            newH[br][bc] &&
            newH[br + 1][bc] &&
            newV[br][bc] &&
            newV[br][bc + 1]
          ) {
            newBoxes[br][bc] = turn;

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

      const best = getBestMove(state, 3);

      if (best) {
        setTimeout(() => {
          handleClick(best.type, best.r, best.c);
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
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f3",
      fontFamily: "Georgia, serif",
    },
    card: {
      background: "#fff",
      borderRadius: 20,
      padding: "2rem",
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
    scoreBar: {
      display: "flex",
      gap: 16,
      alignItems: "center",
    },
    badge: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      padding: "8px 14px",
      borderRadius: 10,
      border: "1px solid #ddd",
    },
    activeBadge: {
      border: "2px solid #000",
    },
    swatch: {
      width: 10,
      height: 10,
      borderRadius: "50%",
    },
    svg: {
      display: "block",
    },
    turnMsg: {
      fontSize: 16,
    },
    winnerMsg: {
      fontSize: 20,
      fontWeight: 600,
    },
    resetBtn: {
      padding: "10px 20px",
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
          <div style={{ ...styles.badge, ...(turn === "blue" ? styles.activeBadge : {}) }}>
            <div style={{ ...styles.swatch, background: "#378ADD" }} />
            {scores.blue}
          </div>

          <div style={{ ...styles.badge, ...(turn === "red" ? styles.activeBadge : {}) }}>
            {scores.red}
            <div style={{ ...styles.swatch, background: "#E24B4A" }} />
          </div>
        </div>

        <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={styles.svg}>
          {/* Horizontal lines */}
          {hLines.map((row, r) =>
            row.map((owner, c) => {
              const x1 = PAD + c * STEP;
              const x2 = PAD + (c + 1) * STEP;
              const y = PAD + r * STEP;

              return (
                <line
                  key={`h-${r}-${c}`}
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={owner ? playerColor(owner) : "transparent"}
                  strokeWidth={4}
                  onClick={() => handleClick("h", r, c)}
                  style={{ cursor: "pointer" }}
                />
              );
            })
          )}

          {/* Vertical lines */}
          {vLines.map((row, r) =>
            row.map((owner, c) => {
              const x = PAD + c * STEP;
              const y1 = PAD + r * STEP;
              const y2 = PAD + (r + 1) * STEP;

              return (
                <line
                  key={`v-${r}-${c}`}
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke={owner ? playerColor(owner) : "transparent"}
                  strokeWidth={4}
                  onClick={() => handleClick("v", r, c)}
                  style={{ cursor: "pointer" }}
                />
              );
            })
          )}
        </svg>

        {winner && (
          <div style={styles.winnerMsg}>
            {winner === "tie" ? "Tie!" : `${winner} wins!`}
          </div>
        )}

        {!winner && (
          <div style={styles.turnMsg}>
            Turn: <b>{turn}</b>
          </div>
        )}

        <button style={styles.resetBtn} onClick={initGame}>
          Reset
        </button>
      </div>
    </div>
  );
}
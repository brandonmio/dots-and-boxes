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
const DOT_R = 7;

const BLUE = "#378ADD";
const RED = "#E24B4A";
const BLUE_FILL = "#378ADD";
const RED_FILL = "#E24B4A";

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
      fontFamily: "'Georgia', serif",
    },
    card: {
      background: "#fff",
      borderRadius: 20,
      padding: "2rem 2.5rem",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1.25rem",
    },
    title: {
      margin: 0,
      fontSize: 28,
      fontWeight: 700,
      color: "#1a1a1a",
    },
    scoreBar: {
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    badge: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      borderRadius: 12,
      border: "1.5px solid #e5e5e5",
      background: "#fafafa",
    },
    activeBadge: {
      border: "1.5px solid #1a1a1a",
      background: "#fff",
    },
    swatch: {
      width: 12,
      height: 12,
      borderRadius: "50%",
    },
    badgeLabel: {
      fontSize: 14,
      fontWeight: 500,
      color: "#333",
    },
    scoreNum: {
      fontSize: 20,
      fontWeight: 700,
      minWidth: 20,
      textAlign: "center",
    },
    vs: {
      fontSize: 13,
      color: "#aaa",
    },
    svg: {
      display: "block",
    },
    turnMsg: {
      fontSize: 15,
      color: "#555",
    },
    winnerMsg: {
      fontSize: 20,
      fontWeight: 600,
      color: "#1a1a1a",
    },
    resetBtn: {
      padding: "10px 28px",
      borderRadius: 10,
      border: "1.5px solid #ddd",
      background: "transparent",
      fontSize: 14,
      cursor: "pointer",
      color: "#333",
      fontFamily: "inherit",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Dots & Boxes</h1>

        <div style={styles.scoreBar}>
          <div
            style={{
              ...styles.badge,
              ...(turn === "blue" && !winner ? styles.activeBadge : {}),
            }}
          >
            <div style={{ ...styles.swatch, background: BLUE }} />
            <span>{scores.blue}</span>
          </div>

          <span style={styles.vs}>vs</span>

          <div
            style={{
              ...styles.badge,
              ...(turn === "red" && !winner ? styles.activeBadge : {}),
            }}
          >
            <span>{scores.red}</span>
            <div style={{ ...styles.swatch, background: RED }} />
          </div>
        </div>

        <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={styles.svg}>
          {/* (your rendering logic unchanged for brevity) */}
        </svg>

        {winner && (
          <div style={styles.winnerMsg}>
            {winner === "tie"
              ? "🤝 It's a tie!"
              : `🎉 ${winner} wins!`}
          </div>
        )}

        {!winner && (
          <div style={styles.turnMsg}>
            <span style={{ color: playerColor(turn), fontWeight: 600 }}>
              {turn}
            </span>{" "}
            turn
          </div>
        )}

        <button style={styles.resetBtn} onClick={initGame}>
          New Game
        </button>
      </div>
    </div>
  );
}
import { useState, useCallback, useEffect } from "react";
import { getBestMove } from "./ai";
import type { GameState } from "./ai";

const COLS = 3;
const ROWS = 3;
const PAD = 50;
const STEP = 90;
const DOT_R = 7;

const BLUE = "#378ADD";
const RED = "#E24B4A";
const BLUE_FILL = "#378ADD";
const RED_FILL = "#E24B4A";

function makeGrid(
  rows: number,
  cols: number,
  val: string | null = null
) {
  return Array.from({ length: rows }, () => Array(cols).fill(val));
}

export default function App() {
  const [turn, setTurn] = useState("blue");
  const [hLines, setHLines] = useState(() => makeGrid(ROWS + 1, COLS));
  const [vLines, setVLines] = useState(() => makeGrid(ROWS, COLS + 1));
  const [boxes, setBoxes] = useState(() => makeGrid(ROWS, COLS));
  const [scores, setScores] = useState({ blue: 0, red: 0 });
  const [hover, setHover] = useState(null);
  const [winner, setWinner] = useState(null);

  const playerColor = (p) => (p === "blue" ? BLUE : RED);

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
    (type, r, c) => {
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
            newScores[turn]++;
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
  }, [turn, hLines, vLines, boxes, scores, winner]);

  const svgW = PAD * 2 + STEP * COLS;
  const svgH = PAD * 2 + STEP * ROWS;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Dots & Boxes</h1>

        {/* Score bar */}
        <div style={styles.scoreBar}>
          <div
            style={{
              ...styles.badge,
              ...(turn === "blue" && !winner ? styles.activeBadge : {}),
            }}
          >
            <div style={{ ...styles.swatch, background: BLUE }} />
            <span style={styles.badgeLabel}>Blue</span>
            <span style={{ ...styles.scoreNum, color: BLUE }}>
              {scores.blue}
            </span>
          </div>

          <span style={styles.vs}>vs</span>

          <div
            style={{
              ...styles.badge,
              ...(turn === "red" && !winner ? styles.activeBadge : {}),
            }}
          >
            <span style={{ ...styles.scoreNum, color: RED }}>{scores.red}</span>
            <span style={styles.badgeLabel}>Red</span>
            <div style={{ ...styles.swatch, background: RED }} />
          </div>
        </div>

        {/* Game SVG */}
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          style={styles.svg}
        >
          {/* Box fills */}
          {boxes.map((row, r) =>
            row.map((owner, c) =>
              owner ? (
                <rect
                  key={`box-${r}-${c}`}
                  x={PAD + c * STEP + 5}
                  y={PAD + r * STEP + 5}
                  width={STEP - 10}
                  height={STEP - 10}
                  rx={8}
                  fill={owner === "blue" ? BLUE_FILL : RED_FILL}
                />
              ) : null
            )
          )}

          {/* Horizontal lines */}
          {Array.from({ length: ROWS + 1 }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const x1 = PAD + c * STEP;
              const x2 = PAD + (c + 1) * STEP;
              const y = PAD + r * STEP;
              const drawn = hLines[r][c];
              const isHovered =
                !drawn &&
                hover &&
                hover.type === "h" &&
                hover.r === r &&
                hover.c === c;

              return (
                <g key={`hl-${r}-${c}`}>
                  {(drawn || isHovered) && (
                    <line
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke={drawn ? playerColor(drawn) : playerColor(turn)}
                      strokeWidth={drawn ? 5 : 3}
                      strokeLinecap="round"
                      opacity={drawn ? 1 : 0.3}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {!drawn && !winner && (
                    <line
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke="transparent"
                      strokeWidth={24}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHover({ type: "h", r, c })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => handleClick("h", r, c)}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Vertical lines */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS + 1 }, (_, c) => {
              const x = PAD + c * STEP;
              const y1 = PAD + r * STEP;
              const y2 = PAD + (r + 1) * STEP;
              const drawn = vLines[r][c];
              const isHovered =
                !drawn &&
                hover &&
                hover.type === "v" &&
                hover.r === r &&
                hover.c === c;

              return (
                <g key={`vl-${r}-${c}`}>
                  {(drawn || isHovered) && (
                    <line
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke={drawn ? playerColor(drawn) : playerColor(turn)}
                      strokeWidth={drawn ? 5 : 3}
                      strokeLinecap="round"
                      opacity={drawn ? 1 : 0.3}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {!drawn && !winner && (
                    <line
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={24}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHover({ type: "v", r, c })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => handleClick("v", r, c)}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Dots */}
          {Array.from({ length: ROWS + 1 }, (_, r) =>
            Array.from({ length: COLS + 1 }, (_, c) => (
              <circle
                key={`dot-${r}-${c}`}
                cx={PAD + c * STEP}
                cy={PAD + r * STEP}
                r={DOT_R}
                fill="#1a1a1a"
                style={{ pointerEvents: "none" }}
              />
            ))
          )}
        </svg>

        {/* Winner message */}
        {winner && (
          <div style={styles.winnerMsg}>
            {winner === "tie"
              ? "🤝 It's a tie!"
              : `🎉 ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`}
          </div>
        )}

        {/* Turn indicator */}
        {!winner && (
          <div style={styles.turnMsg}>
            <span style={{ color: playerColor(turn), fontWeight: 600 }}>
              {turn.charAt(0).toUpperCase() + turn.slice(1)}
            </span>
            {"'s turn"}
          </div>
        )}

        <button style={styles.resetBtn} onClick={initGame}>
          New Game
        </button>
      </div>
    </div>
  );
}

const styles = {
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
    letterSpacing: "-0.5px",
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
    transition: "border-color 0.15s, background 0.15s",
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
    transition: "background 0.15s",
  },
};

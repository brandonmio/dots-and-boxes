import { useState, useCallback, useEffect } from "react";
import { getBestMove } from "./ai";
import type { GameState, MoveEvaluation, Move } from "./ai";
import "./styles.css";

type Player = "blue" | "red";
type Winner = Player | "tie" | null;
type Hover = { type: "h" | "v"; r: number; c: number } | null;
type Difficulty = "easy" | "medium" | "hard";

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
  const [humanPlayer, setHumanPlayer] = useState<Player>("blue");
  const [matchScore, setMatchScore] = useState({ player: 0, bot: 0 });
  const [showChoice, setShowChoice] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player>("blue");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [botEvaluationHistory, setBotEvaluationHistory] = useState<MoveEvaluation[][]>([]);
  const [shownEvaluations, setShownEvaluations] = useState(5);
  const [chosenBotMove, setChosenBotMove] = useState<string | null>(null);

  const aiPlayer: Player = humanPlayer === "blue" ? "red" : "blue";
  const playerColor = (p: Player) => (p === "blue" ? BLUE : RED);

  const difficultyDepth = {
    easy: 1, //bot checks if it will make a box if it makes this move
    medium: 3, //intermediate planning
    hard: 5, //multi-move planning
  };

  const reset = () => {
    setShowChoice(true);
    setMatchScore({ player: 0, bot: 0 });
    setBotEvaluationHistory([]);
    setSelectedPlayer("blue");
    setSelectedDifficulty("medium");
    setTurn("blue");
    setHLines(makeGrid(ROWS + 1, COLS));
    setVLines(makeGrid(ROWS, COLS + 1));
    setBoxes(makeGrid(ROWS, COLS));
    setScores({ blue: 0, red: 0 });
    setHover(null);
    setWinner(null);
  };

  const confirmChoices = () => {
    setHumanPlayer(selectedPlayer);
    setDifficulty(selectedDifficulty);
    setShowChoice(false);
    setBotEvaluationHistory([]);
    setTurn("blue");
    setHLines(makeGrid(ROWS + 1, COLS));
    setVLines(makeGrid(ROWS, COLS + 1));
    setBoxes(makeGrid(ROWS, COLS));
    setScores({ blue: 0, red: 0 });
    setHover(null);
    setWinner(null);
  };

/*  const startGame = (human: Player) => {
    setHumanPlayer(human);
    setShowChoice(false);
    setBotEvaluationHistory([]);
    setTurn("blue");
    setHLines(makeGrid(ROWS + 1, COLS));
    setVLines(makeGrid(ROWS, COLS + 1));
    setBoxes(makeGrid(ROWS, COLS));
    setScores({ blue: 0, red: 0 });
    setHover(null);
    setWinner(null);
  };

  const playFirst = () => {
    startGame("blue");
  };

  const playSecond = () => {
    startGame("red");
  }; */

  const nextGame = () => {
    setBotEvaluationHistory([]);
    setTurn("blue");
    setHLines(makeGrid(ROWS + 1, COLS));
    setVLines(makeGrid(ROWS, COLS + 1));
    setBoxes(makeGrid(ROWS, COLS));
    setScores({ blue: 0, red: 0 });
    setHover(null);
    setWinner(null);
    setShowChoice(false);
  };

  const applyMoveToBoard = useCallback(
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
        let newWinner: Winner = null;

        if (newScores.blue > newScores.red) newWinner = "blue";
        else if (newScores.red > newScores.blue) newWinner = "red";
        else newWinner = "tie";

        setWinner(newWinner);

        if (newWinner === humanPlayer) {
          setMatchScore((prev) => ({
            ...prev,
            player: prev.player + 1,
          }));
        } else if (newWinner === aiPlayer) {
          setMatchScore((prev) => ({
            ...prev,
            bot: prev.bot + 1,
          }));
        }
      } else if (!captured) {
        setTurn(turn === "blue" ? "red" : "blue");
      }
    },
    [turn, hLines, vLines, boxes, scores, winner, humanPlayer, aiPlayer]
  );

  const handleClick = useCallback(
    (type: "h" | "v", r: number, c: number) => {
      if (winner) return;
      if (showChoice) return;
      if (turn !== humanPlayer) return;

      applyMoveToBoard(type, r, c);
    },
    [turn, humanPlayer, winner, showChoice, applyMoveToBoard]
  );

  useEffect(() => {
    if (!showChoice && turn === aiPlayer && !winner) {
      const state: GameState = {
        hLines,
        vLines,
        boxes,
        scores,
        turn,
      };

      const result = getBestMove(state, difficultyDepth[difficulty], aiPlayer);
      setBotEvaluationHistory((prev) => [result.evaluations, ...prev]);

      if (result.move) {
        setTimeout(() => {
          applyMoveToBoard(result.move!.type, result.move!.r, result.move!.c);
        }, 400);
      }
      setChosenBotMove(
        result.move
          ? `${result.move.type}-${result.move.r}-${result.move.c}`
          : null
      );
    }
  }, [showChoice, turn, aiPlayer, hLines, vLines, boxes, scores, winner, difficulty, applyMoveToBoard]);

  /* SIZE OF BOARD */
  const svgW = PAD * 2 + STEP * COLS;
  const svgH = PAD * 2 + STEP * ROWS;

  /* HELPER FUNCTION  (r,c) -> words*/
  function formatMove(move: Move) {
    const { type, r, c } = move;

    if (type === "h") {
      // horizontal: row is r, column is c
      return `Row ${r + 1}, Column ${c + 1}`;
    } else {
      // vertical: row comes from r, column from c
      return `Row ${r + 1}, Column ${c + 1}`;
    }
  }

  return (
  <div className="page">

    {/* POPUP (shows first, blocks everything) */}
    {showChoice && (
      <div className="popup-backdrop">
        <div className="popup-card">
          <h2 className="popup-title">Dots & Boxes</h2>

          <div className="popup-subtitle">
            Meet <strong>Robolomew</strong>, our D&B bot! ┖[ ◨ ▾ ◨]┒
          </div>

          <div className="choice-section">
            <div className="choice-title">Choose your turn</div>

            <div className="choice-buttons">
              <button
                className={`btn ${selectedPlayer === "blue" ? "selected-btn" : ""}`}
                onClick={() => setSelectedPlayer("blue")}
              >
                Play First
              </button>

              <button
                className={`btn ${selectedPlayer === "red" ? "selected-btn" : ""}`}
                onClick={() => setSelectedPlayer("red")}
              >
                Play Second
              </button>
            </div>
          </div>

          <div className="choice-section">
            <div className="choice-title">Difficulty</div>

            <div className="choice-buttons">
              <button
                className={`btn ${selectedDifficulty === "easy" ? "selected-btn" : ""}`}
                onClick={() => setSelectedDifficulty("easy")}
              >
                Easy
              </button>

              <button
                className={`btn ${selectedDifficulty === "medium" ? "selected-btn" : ""}`}
                onClick={() => setSelectedDifficulty("medium")}
              >
                Medium
              </button>

              <button
                className={`btn ${selectedDifficulty === "hard" ? "selected-btn" : ""}`}
                onClick={() => setSelectedDifficulty("hard")}
              >
                Hard
              </button>
            </div>
          </div>

          <button className="btn confirm-btn" onClick={confirmChoices}>
            Start Game
          </button>
        </div>
      </div>
    )}

    {/* GAME ONLY SHOWS AFTER CONFIRM */}
    {!showChoice && (
      <div className="layout">

        {/* GAME CARD */}
        <div className="card">
          <h1 className="title">Dots & Boxes</h1>

          <div className="match-score">
            Player {matchScore.player} - Robolomew {matchScore.bot}
          </div>

          <div className="score">
            <div>🔵 {scores.blue}</div>
            <div>🔴 {scores.red}</div>
          </div>

          <div>You are: {humanPlayer}</div>

          {/* BOARD */}
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: "100%", height: "auto", maxWidth: 420 }}
          >
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
                        className="hover-line"
                      />
                    )}

                    {!owner && (
                      <line
                        x1={PAD + c * STEP}
                        y1={PAD + r * STEP}
                        x2={PAD + (c + 1) * STEP}
                        y2={PAD + r * STEP}
                        className="hitbox"
                        onClick={() => handleClick("h", r, c)}
                        onMouseEnter={() => setHover({ type: "h", r, c })}
                        onMouseLeave={() => setHover(null)}
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
                        className="hover-line"
                      />
                    )}

                    {!owner && (
                      <line
                        x1={PAD + c * STEP}
                        y1={PAD + r * STEP}
                        x2={PAD + c * STEP}
                        y2={PAD + (r + 1) * STEP}
                        className="hitbox"
                        onClick={() => handleClick("v", r, c)}
                        onMouseEnter={() => setHover({ type: "v", r, c })}
                        onMouseLeave={() => setHover(null)}
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

            {Array.from({ length: ROWS + 1 }, (_, r) =>
              Array.from({ length: COLS + 1 }, (_, c) => (
                <circle
                  key={`d-${r}-${c}`}
                  cx={PAD + c * STEP}
                  cy={PAD + r * STEP}
                  r="1.6%"
                  fill="#222"
                />
              ))
            )}
          </svg>

          {winner && (
            <div>
              {winner === "tie" ? "Tie!" : `${winner} wins!`}
            </div>
          )}

          {!winner && !showChoice && (
            <div className="turn-text">
              {turn === humanPlayer
                ? "Your turn"
                : "Robolomew is thinking..."}
            </div>
          )}

          {winner && (
            <button className="btn" onClick={nextGame}>
              Next Game
            </button>
          )}

          <button className="btn" onClick={reset}>
            Reset
          </button>
        </div>

        {/* BOT PANEL */}
        <div className="bot-card">
          <div className="choice-title">Robolomew's Evaluations</div>

          <label>Show {shownEvaluations} per move</label>

          <input
            type="range"
            min="0"
            max="24"
            value={shownEvaluations}
            onChange={(e) => setShownEvaluations(Number(e.target.value))}
          />

          {botEvaluationHistory.length === 0 ? (
            <div className="small-text">No bot move yet.</div>
          ) : (
            <div className="evaluation-list">
              {botEvaluationHistory.map((evaluations, historyIndex) => (
                <div className="evaluation-group" key={historyIndex}>
                  <div className="small-text">
                    Evaluations behind move {botEvaluationHistory.length - historyIndex}
                  </div>

                  {evaluations
                    .slice(0, shownEvaluations)
                    .map((item, index) => (
                      <div
                        className={`evaluations ${
                          chosenBotMove === `${item.move.type}-${item.move.r}-${item.move.c}`
                            ? "chosen-move"
                            : ""
                        }`}
                        key={`${historyIndex}-${item.move.type}-${item.move.r}-${item.move.c}`}
                      >
                        #{index + 1}: {item.move.type === "h" ? "—" : "|"} {formatMove(item.move)} → {item.score}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    )}

  </div>
)};
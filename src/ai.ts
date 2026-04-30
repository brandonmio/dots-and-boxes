export type Move =
  | { type: "h"; r: number; c: number }
  | { type: "v"; r: number; c: number };

export type GameState = {
  hLines: (string | null)[][];
  vLines: (string | null)[][];
  boxes: (string | null)[][];
  scores: { blue: number; red: number };
  turn: "blue" | "red";
};

const ROWS = 3;
const COLS = 3;

//gets all possible moves
export function getMoves(state: GameState): Move[] {
  const moves: Move[] = [];

  for (let r = 0; r < ROWS + 1; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!state.hLines[r][c]) {
        moves.push({ type: "h", r, c });
      }
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS + 1; c++) {
      if (!state.vLines[r][c]) {
        moves.push({ type: "v", r, c });
      }
    }
  }

  return moves;
}

//applies a move
export function applyMove(state: GameState, move: Move): GameState {
  const newH = state.hLines.map((row) => [...row]);
  const newV = state.vLines.map((row) => [...row]);
  const newBoxes = state.boxes.map((row) => [...row]);
  const newScores = { ...state.scores };

  const player = state.turn;
  let captured = false;

  if (move.type === "h") {
    newH[move.r][move.c] = player;
  } else {
    newV[move.r][move.c] = player;
  }

  // check completed boxes
  for (let br = 0; br < ROWS; br++) {
    for (let bc = 0; bc < COLS; bc++) {
      if (newBoxes[br][bc]) continue;

      if (
        newH[br][bc] &&
        newH[br + 1][bc] &&
        newV[br][bc] &&
        newV[br][bc + 1]
      ) {
        newBoxes[br][bc] = player;
        newScores[player]++;
        captured = true;
      }
    }
  }

  return {
    hLines: newH,
    vLines: newV,
    boxes: newBoxes,
    scores: newScores,
    turn: captured ? player : player === "blue" ? "red" : "blue",
  };
}

// check if game is over
export function isTerminal(state: GameState): boolean {
  return state.scores.blue + state.scores.red === ROWS * COLS;
}

// evaluate board state
export function evaluate(state: GameState): number {
  return state.scores.red - state.scores.blue;
}

// minmax algo
export function minimax(
  state: GameState,
  depth: number,
  isMax: boolean
): number {
  if (depth === 0 || isTerminal(state)) {
    return evaluate(state);
  }

  const moves = getMoves(state);

  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      const newState = applyMove(state, move);
      const val = minimax(newState, depth - 1, false);
      best = Math.max(best, val);
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const newState = applyMove(state, move);
      const val = minimax(newState, depth - 1, true);
      best = Math.min(best, val);
    }
    return best;
  }
}

// get best move for ai
export function getBestMove(state: GameState, depth: number): Move | null {
  let bestVal = -Infinity;
  let bestMove: Move | null = null;

  const moves = getMoves(state);

  for (const move of moves) {
    const newState = applyMove(state, move);
    const val = minimax(newState, depth - 1, false);

    if (val > bestVal) {
      bestVal = val;
      bestMove = move;
    }
  }

  return bestMove;
}

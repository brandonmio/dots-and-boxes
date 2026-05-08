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

export type MoveEvaluation = {
  move: Move;
  score: number;
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
export function evaluate(
  state: GameState,
  aiPlayer: "blue" | "red"
): number {
  const humanPlayer = aiPlayer === "blue" ? "red" : "blue";
  // bot player boxes - human player boxes
  return state.scores[aiPlayer] - state.scores[humanPlayer]; //pos num = good for bot
}

// minimax algo with alpha-beta pruning
export function minimax(
  state: GameState,
  depth: number,
  aiPlayer: "blue" | "red",
  alpha = -Infinity, //best score bot can guarantee right now
  beta = Infinity //best score player " "
): number {
  // stop searching when max depth reached oe game ends
  if (depth === 0 || isTerminal(state)) {
    return evaluate(state, aiPlayer);
  }

  const moves = getMoves(state).sort(() => Math.random() - 0.5);
  const isMax = state.turn === aiPlayer;

  if (isMax) {
    let best = -Infinity;

    for (const move of moves) {
      const newState = applyMove(state, move);
      const val = minimax(newState, depth - 1, aiPlayer, alpha, beta);

      best = Math.max(best, val);
      alpha = Math.max(alpha, best);

      //pruning while bot finds highest score
      if (beta <= alpha) { 
        break;
      }
    }

    return best;
  } else {
    let best = Infinity;

    for (const move of moves) {
      const newState = applyMove(state, move);
      const val = minimax(newState, depth - 1, aiPlayer, alpha, beta);

      best = Math.min(best, val);
      beta = Math.min(beta, best);

      //pruning, assuming player makes worst move for bot (player minimizing)
      if (beta <= alpha) { 
        break;
      }
    }

    return best;
  }
}

// get best move for ai
export function getBestMove(
  state: GameState,
  depth: number,
  aiPlayer: "blue" | "red"
): { move: Move | null; evaluations: MoveEvaluation[] } {
  let bestVal = -Infinity;
  let bestMoves: Move[] = [];

  const moves = getMoves(state);
  const evaluations: MoveEvaluation[] = [];

  for (const move of moves) {
    const newState = applyMove(state, move);
    const val = minimax(newState, depth - 1, aiPlayer);

    evaluations.push({ move, score: val });

    //gathers all moves with the same best score (tie)
    if (val > bestVal) {
      bestVal = val;
      bestMoves = [move];
    } else if (val === bestVal) {
      bestMoves.push(move);
    }
  }

  if (bestMoves.length === 0) {
    return { move: null, evaluations };
  }

  //randomizes move out of the tie (tie-breaker)
  const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  evaluations.sort((a, b) => b.score - a.score);

  return { move, evaluations };
}
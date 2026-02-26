import React, { useState, useCallback, useEffect, useRef } from 'react';
import BackButton from './BackButton';
import './Chess.css';

/* ─── constants ──────────────────────────────────────────── */
const EMPTY = 0;
const WP = 1, WN = 2, WB = 3, WR = 4, WQ = 5, WK = 6;
const BP = 7, BN = 8, BB = 9, BR = 10, BQ = 11, BK = 12;

const PIECE_CHAR = {
  [WP]: '♙', [WN]: '♘', [WB]: '♗', [WR]: '♖', [WQ]: '♕', [WK]: '♔',
  [BP]: '♟', [BN]: '♞', [BB]: '♝', [BR]: '♜', [BQ]: '♛', [BK]: '♚',
};

const isWhite = (p) => p >= WP && p <= WK;
const isBlack = (p) => p >= BP && p <= BK;
const colorOf = (p) => (p === EMPTY ? null : isWhite(p) ? 'w' : 'b');

/* Piece-square tables (simplified, white perspective – flip for black) */
const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0
];
const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50
];
const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20
];
const PST_ROOK = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0
];
const PST_QUEEN = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20
];
const PST_KING = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20
];

function pstValue(piece, idx) {
  const type = isWhite(piece) ? piece : piece - 6;
  const i = isWhite(piece) ? idx : (7 - Math.floor(idx / 8)) * 8 + (idx % 8);
  switch (type) {
    case WP: return PST_PAWN[i];
    case WN: return PST_KNIGHT[i];
    case WB: return PST_BISHOP[i];
    case WR: return PST_ROOK[i];
    case WQ: return PST_QUEEN[i];
    case WK: return PST_KING[i];
    default: return 0;
  }
}

const PIECE_VALUE = { [WP]: 100, [WN]: 320, [WB]: 330, [WR]: 500, [WQ]: 900, [WK]: 20000,
  [BP]: 100, [BN]: 320, [BB]: 330, [BR]: 500, [BQ]: 900, [BK]: 20000 };

/* ─── initial board ──────────────────────────────────────── */
function initialBoard() {
  return [
    BR, BN, BB, BQ, BK, BB, BN, BR,
    BP, BP, BP, BP, BP, BP, BP, BP,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    WP, WP, WP, WP, WP, WP, WP, WP,
    WR, WN, WB, WQ, WK, WB, WN, WR,
  ];
}

function initialCastle() { return { wk: true, wq: true, bk: true, bq: true }; }

/* ─── move generation ────────────────────────────────────── */
const rc = (i) => [Math.floor(i / 8), i % 8];
const idx = (r, c) => r * 8 + c;
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function generateMoves(board, turn, castle, enPassant) {
  const moves = [];
  const mine = turn === 'w' ? isWhite : isBlack;
  const enemy = turn === 'w' ? isBlack : isWhite;

  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!mine(p)) continue;
    const [r, c] = rc(i);
    const type = isWhite(p) ? p : p - 6;

    if (type === WP) {
      const dir = turn === 'w' ? -1 : 1;
      const startRow = turn === 'w' ? 6 : 1;
      const promoRow = turn === 'w' ? 0 : 7;
      // Forward
      const fr = r + dir;
      if (inBounds(fr, c) && board[idx(fr, c)] === EMPTY) {
        if (fr === promoRow) {
          for (const pp of (turn === 'w' ? [WQ, WR, WB, WN] : [BQ, BR, BB, BN]))
            moves.push({ from: i, to: idx(fr, c), promo: pp });
        } else {
          moves.push({ from: i, to: idx(fr, c) });
          // Double push
          if (r === startRow && board[idx(r + 2 * dir, c)] === EMPTY)
            moves.push({ from: i, to: idx(r + 2 * dir, c), double: true });
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        if (!inBounds(fr, c + dc)) continue;
        const ti = idx(fr, c + dc);
        if (enemy(board[ti]) || ti === enPassant) {
          if (fr === promoRow) {
            for (const pp of (turn === 'w' ? [WQ, WR, WB, WN] : [BQ, BR, BB, BN]))
              moves.push({ from: i, to: ti, promo: pp, ep: ti === enPassant });
          } else {
            moves.push({ from: i, to: ti, ep: ti === enPassant });
          }
        }
      }
    } else if (type === WN) {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && !mine(board[idx(nr, nc)]))
          moves.push({ from: i, to: idx(nr, nc) });
      }
    } else if (type === WB || type === WR || type === WQ) {
      const dirs = [];
      if (type === WB || type === WQ) dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (type === WR || type === WQ) dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
          const ti = idx(nr, nc);
          if (mine(board[ti])) break;
          moves.push({ from: i, to: ti });
          if (enemy(board[ti])) break;
          nr += dr; nc += dc;
        }
      }
    } else if (type === WK) {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && !mine(board[idx(nr, nc)]))
          moves.push({ from: i, to: idx(nr, nc) });
      }
      // Castling
      if (turn === 'w') {
        if (castle.wk && board[61] === EMPTY && board[62] === EMPTY && board[63] === WR)
          moves.push({ from: i, to: 62, castle: 'wk' });
        if (castle.wq && board[59] === EMPTY && board[58] === EMPTY && board[57] === EMPTY && board[56] === WR)
          moves.push({ from: i, to: 58, castle: 'wq' });
      } else {
        if (castle.bk && board[5] === EMPTY && board[6] === EMPTY && board[7] === BR)
          moves.push({ from: i, to: 6, castle: 'bk' });
        if (castle.bq && board[3] === EMPTY && board[2] === EMPTY && board[1] === EMPTY && board[0] === BR)
          moves.push({ from: i, to: 2, castle: 'bq' });
      }
    }
  }
  return moves;
}

function isSquareAttacked(board, sq, byColor) {
  const attacker = byColor === 'w' ? isWhite : isBlack;
  const [r, c] = rc(sq);
  // Knight attacks
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[idx(nr, nc)];
      if (attacker(p) && (isWhite(p) ? p : p - 6) === WN) return true;
    }
  }
  // Pawn attacks
  const pawnDir = byColor === 'w' ? 1 : -1; // attacking from below -> row increases
  for (const dc of [-1, 1]) {
    const pr = r + pawnDir, pc = c + dc;
    if (inBounds(pr, pc)) {
      const p = board[idx(pr, pc)];
      if (attacker(p) && (isWhite(p) ? p : p - 6) === WP) return true;
    }
  }
  // King attacks
  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[idx(nr, nc)];
      if (attacker(p) && (isWhite(p) ? p : p - 6) === WK) return true;
    }
  }
  // Sliding attacks (bishop/rook/queen)
  const slideDirs = [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
  for (let d = 0; d < 8; d++) {
    const [dr, dc] = slideDirs[d];
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[idx(nr, nc)];
      if (p !== EMPTY) {
        if (attacker(p)) {
          const t = isWhite(p) ? p : p - 6;
          const isBishopDir = d < 4;
          if (t === WQ) return true;
          if (isBishopDir && t === WB) return true;
          if (!isBishopDir && t === WR) return true;
        }
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
}

function findKing(board, color) {
  const k = color === 'w' ? WK : BK;
  return board.indexOf(k);
}

function makeMove(board, castle, enPassant, move) {
  const nb = [...board];
  const nc = { ...castle };
  let nep = -1;
  const piece = nb[move.from];

  nb[move.to] = move.promo || piece;
  nb[move.from] = EMPTY;

  // En passant capture
  if (move.ep) {
    const epDir = colorOf(piece) === 'w' ? 1 : -1;
    nb[move.to + epDir * 8] = EMPTY;
  }

  // Double pawn push sets en passant target
  if (move.double) {
    nep = (move.from + move.to) / 2;
  }

  // Castling rook move
  if (move.castle === 'wk') { nb[61] = WR; nb[63] = EMPTY; }
  if (move.castle === 'wq') { nb[59] = WR; nb[56] = EMPTY; }
  if (move.castle === 'bk') { nb[5] = BR; nb[7] = EMPTY; }
  if (move.castle === 'bq') { nb[3] = BR; nb[0] = EMPTY; }

  // Update castling rights
  if (move.from === 60 || move.to === 60) { nc.wk = false; nc.wq = false; }
  if (move.from === 4 || move.to === 4) { nc.bk = false; nc.bq = false; }
  if (move.from === 63 || move.to === 63) nc.wk = false;
  if (move.from === 56 || move.to === 56) nc.wq = false;
  if (move.from === 7 || move.to === 7) nc.bk = false;
  if (move.from === 0 || move.to === 0) nc.bq = false;

  return { board: nb, castle: nc, enPassant: nep };
}

function legalMoves(board, turn, castle, enPassant) {
  const pseudo = generateMoves(board, turn, castle, enPassant);
  const legal = [];
  const opp = turn === 'w' ? 'b' : 'w';
  for (const m of pseudo) {
    // For castling, verify king doesn't cross attacked square
    if (m.castle) {
      const kingIdx = findKing(board, turn);
      if (isSquareAttacked(board, kingIdx, opp)) continue;
      const between = m.castle.endsWith('k')
        ? [kingIdx + 1, kingIdx + 2]
        : [kingIdx - 1, kingIdx - 2];
      if (between.some(sq => isSquareAttacked(board, sq, opp))) continue;
    }
    const { board: nb } = makeMove(board, castle, enPassant, m);
    const kingSq = findKing(nb, turn);
    if (kingSq === -1 || isSquareAttacked(nb, kingSq, opp)) continue;
    legal.push(m);
  }
  return legal;
}

function isInCheck(board, turn) {
  const kingSq = findKing(board, turn);
  const opp = turn === 'w' ? 'b' : 'w';
  return kingSq !== -1 && isSquareAttacked(board, kingSq, opp);
}

/* ─── AI (minimax with alpha-beta) ───────────────────────── */
function evaluate(board) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p === EMPTY) continue;
    const val = PIECE_VALUE[p] + pstValue(p, i);
    score += isWhite(p) ? val : -val;
  }
  return score;
}

function minimax(board, castle, enPassant, depth, alpha, beta, maximising, turn) {
  if (depth === 0) return { score: evaluate(board), move: null };

  const moves = legalMoves(board, turn, castle, enPassant);
  if (moves.length === 0) {
    if (isInCheck(board, turn)) return { score: maximising ? -99999 : 99999, move: null };
    return { score: 0, move: null }; // stalemate
  }

  // Move ordering: captures first, then promotions
  moves.sort((a, b) => {
    const va = board[a.to] !== EMPTY ? PIECE_VALUE[board[a.to]] || 0 : 0;
    const vb = board[b.to] !== EMPTY ? PIECE_VALUE[board[b.to]] || 0 : 0;
    return vb - va;
  });

  let best = null;
  if (maximising) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const { board: nb, castle: nc, enPassant: nep } = makeMove(board, castle, enPassant, m);
      const { score } = minimax(nb, nc, nep, depth - 1, alpha, beta, false, 'b');
      if (score > maxEval) { maxEval = score; best = m; }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: best };
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const { board: nb, castle: nc, enPassant: nep } = makeMove(board, castle, enPassant, m);
      const { score } = minimax(nb, nc, nep, depth - 1, alpha, beta, true, 'w');
      if (score < minEval) { minEval = score; best = m; }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: best };
  }
}

/* ─── React component ────────────────────────────────────── */
const DIFFICULTY = [
  { label: 'Beginner', depth: 1 },
  { label: 'Easy', depth: 2 },
  { label: 'Medium', depth: 3 },
  { label: 'Hard', depth: 5 },
];

export default function Chess() {
  const [board, setBoard] = useState(initialBoard);
  const [castle, setCastle] = useState(initialCastle);
  const [enPassant, setEnPassant] = useState(-1);
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState(null);
  const [legalForSelected, setLegalForSelected] = useState([]);
  const [diffIdx, setDiffIdx] = useState(1);
  const [status, setStatus] = useState('playing'); // playing | check | checkmate | stalemate | draw_menu
  const [thinking, setThinking] = useState(false);
  const [capturedHuman, setCapturedHuman] = useState([]);
  const [capturedAI, setCapturedAI] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [promoSquare, setPromoSquare] = useState(null); // { from, to } awaiting promo choice
  const [humanColor, setHumanColor] = useState('w'); // 'w' | 'b'
  const [history, setHistory] = useState([{ board: initialBoard(), lastMove: null }]);
  const [viewIdx, setViewIdx] = useState(0);
  const thinkingRef = useRef(false);
  const isViewingHistory = viewIdx < history.length - 1;

  const resetGame = useCallback((color = humanColor) => {
    setHumanColor(color);
    setBoard(initialBoard());
    setCastle(initialCastle());
    setEnPassant(-1);
    setTurn('w');
    setSelected(null);
    setLegalForSelected([]);
    setStatus('playing');
    setThinking(false);
    setCapturedHuman([]);
    setCapturedAI([]);
    setLastMove(null);
    setMoveHistory([]);
    setPromoSquare(null);
    setHistory([{ board: initialBoard(), lastMove: null }]);
    setViewIdx(0);
    thinkingRef.current = false;
  }, [humanColor]);

  const aiColor = humanColor === 'w' ? 'b' : 'w';
  const humanLabel = humanColor === 'w' ? 'White' : 'Black';
  const aiLabel = aiColor === 'w' ? 'White' : 'Black';

  const applyMove = useCallback((b, c, ep, move) => {
    const captured = b[move.to];
    const { board: nb, castle: nc, enPassant: nep } = makeMove(b, c, ep, move);
    const nextTurn = turn === 'w' ? 'b' : 'w';
    const moverIsHuman = turn === humanColor;

    // Track captures
    if (captured !== EMPTY) {
      (moverIsHuman ? setCapturedHuman : setCapturedAI)(prev => [...prev, captured]);
    }
    // EP capture
    if (move.ep) {
      const epPiece = turn === 'w' ? BP : WP;
      (moverIsHuman ? setCapturedHuman : setCapturedAI)(prev => [...prev, epPiece]);
    }

    setBoard(nb);
    setCastle(nc);
    setEnPassant(nep);
    setTurn(nextTurn);
    setSelected(null);
    setLegalForSelected([]);
    const newLastMove = { from: move.from, to: move.to };
    setLastMove(newLastMove);
    setMoveHistory(prev => [...prev, move]);
    setHistory(prev => {
      const next = [...prev, { board: [...nb], lastMove: newLastMove }];
      return next;
    });
    setViewIdx(prev => prev + 1);

    // Check game state
    const nextLegal = legalMoves(nb, nextTurn, nc, nep);
    if (nextLegal.length === 0) {
      if (isInCheck(nb, nextTurn)) setStatus('checkmate');
      else setStatus('stalemate');
    } else if (isInCheck(nb, nextTurn)) {
      setStatus('check');
    } else {
      setStatus('playing');
    }

    return { nb, nc, nep, nextTurn };
  }, [turn, humanColor]);

  // AI move
  useEffect(() => {
    if (turn !== aiColor || status === 'checkmate' || status === 'stalemate' || thinkingRef.current) return;
    thinkingRef.current = true;
    setThinking(true);

    const depth = DIFFICULTY[diffIdx].depth;

    // Run AI in a setTimeout to avoid blocking the UI
    const timer = setTimeout(() => {
      const { move } = minimax(board, castle, enPassant, depth, -Infinity, Infinity, aiColor === 'w', aiColor);
      if (move) {
        applyMove(board, castle, enPassant, move);
      }
      setThinking(false);
      thinkingRef.current = false;
    }, 50);

    return () => clearTimeout(timer);
  }, [turn, board, castle, enPassant, status, diffIdx, applyMove, aiColor]);

  // ─── History navigation ─────────────────────────────────
  const goBack = () => setViewIdx(v => Math.max(0, v - 1));
  const goForward = () => setViewIdx(v => Math.min(history.length - 1, v + 1));
  const goToLatest = () => setViewIdx(history.length - 1);

  // ─── Save / Load ──────────────────────────────────────────
  const saveGame = () => {
    const state = {
      board, castle, enPassant, turn, capturedHuman, capturedAI,
      lastMove, moveHistory, status, humanColor, diffIdx, history, viewIdx
    };
    localStorage.setItem('chess-save', JSON.stringify(state));
  };
  const loadGame = () => {
    const raw = localStorage.getItem('chess-save');
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      setBoard(s.board);
      setCastle(s.castle);
      setEnPassant(s.enPassant);
      setTurn(s.turn);
      setCapturedHuman(s.capturedHuman || []);
      setCapturedAI(s.capturedAI || []);
      setLastMove(s.lastMove);
      setMoveHistory(s.moveHistory || []);
      setStatus(s.status);
      setHumanColor(s.humanColor);
      setDiffIdx(s.diffIdx);
      setHistory(s.history || [{ board: initialBoard(), lastMove: null }]);
      setViewIdx(s.viewIdx ?? (s.history ? s.history.length - 1 : 0));
      setSelected(null);
      setLegalForSelected([]);
      setPromoSquare(null);
      setThinking(false);
      thinkingRef.current = false;
    } catch (e) { /* ignore bad data */ }
  };
  const hasSave = typeof window !== 'undefined' && !!localStorage.getItem('chess-save');

  // ─── Display board (history vs live) ──────────────────────
  const displayBoard = isViewingHistory ? history[viewIdx].board : board;
  const displayLastMove = isViewingHistory ? history[viewIdx].lastMove : lastMove;

  const handleSquareClick = (i) => {
    if (isViewingHistory) return;
    if (turn !== humanColor || thinking || status === 'checkmate' || status === 'stalemate') return;
    if (promoSquare) return;

    const piece = board[i];

    if (selected !== null) {
      // Try to move
      const move = legalForSelected.find(m => m.to === i);
      if (move) {
        // Check if this is a pawn promotion
        const movingPiece = board[selected];
        const [tr] = rc(i);
        if ((movingPiece === WP && tr === 0) || (movingPiece === BP && tr === 7)) {
          setPromoSquare({ from: selected, to: i });
          return;
        }
        applyMove(board, castle, enPassant, move);
        return;
      }
      // Re-select own piece
      if ((humanColor === 'w' && isWhite(piece)) || (humanColor === 'b' && isBlack(piece))) {
        setSelected(i);
        setLegalForSelected(legalMoves(board, humanColor, castle, enPassant).filter(m => m.from === i));
        return;
      }
      setSelected(null);
      setLegalForSelected([]);
      return;
    }

    // Select own piece
    if ((humanColor === 'w' && isWhite(piece)) || (humanColor === 'b' && isBlack(piece))) {
      setSelected(i);
      setLegalForSelected(legalMoves(board, humanColor, castle, enPassant).filter(m => m.from === i));
    }
  };

  const handlePromo = (promoPiece) => {
    if (!promoSquare) return;
    const move = { from: promoSquare.from, to: promoSquare.to, promo: promoPiece };
    setPromoSquare(null);
    applyMove(board, castle, enPassant, move);
  };

  const legalTargets = new Set(legalForSelected.map(m => m.to));

  return (
    <div className="chess-root">
      <div className="chess-sidebar">
        <h1>♚ Chess</h1>
        <div className="chess-side">
          <label>Your side</label>
          <div className="chess-side-btns">
            <button
              className={humanColor === 'w' ? 'active' : ''}
              onClick={() => resetGame('w')}
            >Play White</button>
            <button
              className={humanColor === 'b' ? 'active' : ''}
              onClick={() => resetGame('b')}
            >Play Black</button>
            <button onClick={() => resetGame(Math.random() < 0.5 ? 'w' : 'b')}>Coin Toss</button>
          </div>
        </div>
        <div className="chess-diff">
          <label>AI Difficulty</label>
          <div className="chess-diff-btns">
            {DIFFICULTY.map((d, i) => (
              <button
                key={d.label}
                className={i === diffIdx ? 'active' : ''}
                onClick={() => { setDiffIdx(i); resetGame(); }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="chess-captured">
          <div className="chess-cap-row">
            <span className="chess-cap-label">Captured by you ({humanLabel}):</span>
            <span className="chess-cap-pieces">{capturedHuman.map((p, i) => <span key={i}>{PIECE_CHAR[p]}</span>)}</span>
          </div>
          <div className="chess-cap-row">
            <span className="chess-cap-label">Captured by AI ({aiLabel}):</span>
            <span className="chess-cap-pieces">{capturedAI.map((p, i) => <span key={i}>{PIECE_CHAR[p]}</span>)}</span>
          </div>
        </div>
        <div className="chess-status">
          {status === 'check' && <span className="chess-check">Check!</span>}
          {status === 'checkmate' && <span className="chess-mate">{turn === aiColor ? 'Checkmate — You win!' : 'Checkmate — AI wins!'}</span>}
          {status === 'stalemate' && <span className="chess-stale">Stalemate — Draw!</span>}
          {thinking && <span className="chess-thinking">AI thinking…</span>}
          {status === 'playing' && !thinking && turn === humanColor && <span className="chess-your-turn">Your turn ({humanLabel})</span>}
          {status === 'playing' && !thinking && turn === aiColor && <span className="chess-ai-turn">AI turn ({aiLabel})</span>}
        </div>
        <div className="chess-moves-log">
          <label>Moves: {moveHistory.length}</label>
        </div>
        <div className="chess-history-nav">
          <button onClick={goBack} disabled={viewIdx === 0} title="Previous move">◀</button>
          <span>{viewIdx} / {history.length - 1}</span>
          <button onClick={goForward} disabled={viewIdx >= history.length - 1} title="Next move">▶</button>
          {isViewingHistory && <button className="chess-go-live" onClick={goToLatest}>Go to Live</button>}
        </div>
        {isViewingHistory && <div className="chess-history-badge">Viewing history</div>}
        <div className="chess-saveload">
          <button onClick={saveGame} title="Save game to browser">💾 Save</button>
          <button onClick={loadGame} disabled={!hasSave} title="Load saved game">📂 Load</button>
        </div>
        <button className="chess-reset" onClick={resetGame}>New Game</button>
      </div>

      <div className="chess-board-area">
        <div className="chess-board">
          {Array.from({ length: 64 }, (_, dispIdx) => {
            const logicalIndex = humanColor === 'w' ? dispIdx : 63 - dispIdx; // flip board when human is black
            const piece = displayBoard[logicalIndex];
            const displayRow = Math.floor(dispIdx / 8);
            const displayCol = dispIdx % 8;
            const isDark = (displayRow + displayCol) % 2 === 1;
            const isLegalTarget = legalTargets.has(logicalIndex);
            const isSelected = selected === logicalIndex;
            const isLastFrom = displayLastMove && displayLastMove.from === logicalIndex;
            const isLastTo = displayLastMove && displayLastMove.to === logicalIndex;
            const inCheck = (status === 'check' || status === 'checkmate') &&
              ((piece === WK && turn === 'w') || (piece === BK && turn === 'b'));
            const rankLabel = humanColor === 'w' ? 8 - displayRow : displayRow + 1;
            const fileLabel = humanColor === 'w' ? 'abcdefgh'[displayCol] : 'abcdefgh'[7 - displayCol];

            return (
              <div
                key={dispIdx}
                className={`chess-sq ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isLastFrom || isLastTo ? 'last-move' : ''} ${inCheck ? 'in-check' : ''}`}
                onClick={() => handleSquareClick(logicalIndex)}
              >
                {displayCol === 0 && <span className="chess-rank-label">{rankLabel}</span>}
                {displayRow === 7 && <span className="chess-file-label">{fileLabel}</span>}
                {isLegalTarget && <div className={`chess-legal-dot ${piece !== EMPTY ? 'capture' : ''}`} />}
                {piece !== EMPTY && (
                  <span className={`chess-piece ${isWhite(piece) ? 'white' : 'black'}`}>
                    {PIECE_CHAR[piece]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {promoSquare && (
          <div className="chess-promo-overlay">
            <div className="chess-promo-dialog">
              <p>Promote to:</p>
              <div className="chess-promo-options">
                {(humanColor === 'w' ? [WQ, WR, WB, WN] : [BQ, BR, BB, BN]).map(pp => (
                  <button key={pp} onClick={() => handlePromo(pp)}>
                    {PIECE_CHAR[pp]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(status === 'checkmate' || status === 'stalemate') && (
        <div className="chess-game-over">
          <h2>{status === 'checkmate' ? (turn === aiColor ? '♔ You Win!' : '♚ AI Wins!') : '½ Draw'}</h2>
          <p>{status === 'checkmate' ? 'Checkmate' : 'Stalemate'}</p>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}

      <BackButton />
    </div>
  );
}

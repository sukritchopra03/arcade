import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

const MainMenu = lazy(() => import('./pages/MainMenu'));
const Pong = lazy(() => import('./pages/Pong'));
const TicTacToe = lazy(() => import('./pages/TicTacToe'));
const RPS = lazy(() => import('./pages/RPS'));
const Snake = lazy(() => import('./pages/Snake'));
const Racing = lazy(() => import('./pages/Racing'));
const TempleRunner = lazy(() => import('./pages/TempleRunner2'));
const StickFighter = lazy(() => import('./pages/StickFighter'));
const Solitaire = lazy(() => import('./pages/Solitaire'));
const FlappyBird = lazy(() => import('./pages/FlappyBird'));
const Breakout = lazy(() => import('./pages/Breakout'));
const Chess = lazy(() => import('./pages/Chess'));
const TeenPatti = lazy(() => import('./pages/TeenPatti'));
const Rummy = lazy(() => import('./pages/Rummy'));
const GoFish = lazy(() => import('./pages/GoFish'));
const Checkers = lazy(() => import('./pages/Checkers'));
const Minesweeper = lazy(() => import('./pages/Minesweeper'));
const Game2048 = lazy(() => import('./pages/Game2048'));
const Wordle = lazy(() => import('./pages/Wordle'));
const ConnectFour = lazy(() => import('./pages/ConnectFour'));
const Sudoku = lazy(() => import('./pages/Sudoku'));
const MemoryMatch = lazy(() => import('./pages/MemoryMatch'));
const Tetris = lazy(() => import('./pages/Tetris'));
const SpaceInvaders = lazy(() => import('./pages/SpaceInvaders'));
const Hangman = lazy(() => import('./pages/Hangman'));
const TypingTest = lazy(() => import('./pages/TypingTest'));
const WhackAMole = lazy(() => import('./pages/WhackAMole'));
const SimonSays = lazy(() => import('./pages/SimonSays'));
const TowerOfHanoi = lazy(() => import('./pages/TowerOfHanoi'));
const Reversi = lazy(() => import('./pages/Reversi'));
const DoodleJump = lazy(() => import('./pages/DoodleJump'));
const ReactionTest = lazy(() => import('./pages/ReactionTest'));

function Loader() {
  return (
    <div className="global-loader">
      <div className="loader-spinner" />
      <p>Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/pong" element={<Pong />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/rps" element={<RPS />} />
        <Route path="/snake" element={<Snake />} />
        <Route path="/racing" element={<Racing />} />
        <Route path="/templerunner" element={<TempleRunner />} />
        <Route path="/stickfighter" element={<StickFighter />} />
        <Route path="/solitaire" element={<Solitaire />} />
        <Route path="/flappybird" element={<FlappyBird />} />
        <Route path="/breakout" element={<Breakout />} />
        <Route path="/chess" element={<Chess />} />
        <Route path="/teenpatti" element={<TeenPatti />} />
        <Route path="/rummy" element={<Rummy />} />
        <Route path="/gofish" element={<GoFish />} />
        <Route path="/checkers" element={<Checkers />} />
        <Route path="/minesweeper" element={<Minesweeper />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/wordle" element={<Wordle />} />
        <Route path="/connectfour" element={<ConnectFour />} />
        <Route path="/sudoku" element={<Sudoku />} />
        <Route path="/memorymatch" element={<MemoryMatch />} />
        <Route path="/tetris" element={<Tetris />} />
        <Route path="/spaceinvaders" element={<SpaceInvaders />} />
        <Route path="/hangman" element={<Hangman />} />
        <Route path="/typingtest" element={<TypingTest />} />
        <Route path="/whackamole" element={<WhackAMole />} />
        <Route path="/simonsays" element={<SimonSays />} />
        <Route path="/towerofhanoi" element={<TowerOfHanoi />} />
        <Route path="/reversi" element={<Reversi />} />
        <Route path="/doodlejump" element={<DoodleJump />} />
        <Route path="/reactiontest" element={<ReactionTest />} />
      </Routes>
    </Suspense>
  );
}

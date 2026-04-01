import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainMenu.css';

const games = [
  { path: '/pong', icon: '🏓', title: 'Pong', desc: 'Classic paddle vs AI', color: '#00e5ff' },
  { path: '/tictactoe', icon: '❌', title: 'Tic-Tac-Toe', desc: '3×3, play X vs AI', color: '#f06292' },
  { path: '/rps', icon: '✊', title: 'Rock Paper Scissors', desc: 'Animated showdown vs CPU', color: '#ffd740' },
  { path: '/snake', icon: '🐍', title: 'Snake', desc: 'Classic single-player', color: '#69f0ae' },
  { path: '/racing', icon: '🏎️', title: '3D Racing', desc: 'Fast-paced 3D car racing', color: '#ff5252' },
  { path: '/templerunner', icon: '🏃', title: 'Temple Runner', desc: '3D endless runner adventure', color: '#ffd86b' },
  { path: '/stickfighter', icon: '🥊', title: 'Stickman Fighter', desc: 'Epic stickman combat', color: '#e040fb' },
  { path: '/solitaire', icon: '♠️', title: 'Solitaire', desc: 'Classic card game', color: '#448aff' },
  { path: '/flappybird', icon: '🐦', title: 'Flappy Bird', desc: 'Tap to flap and survive', color: '#F4D03F' },
  { path: '/breakout', icon: '🧱', title: 'Breakout', desc: 'Break bricks with the ball', color: '#ff6e40' },
  { path: '/chess', icon: '♟️', title: 'Chess', desc: 'AI or Online Multiplayer', color: '#ffd740' },
  { path: '/teenpatti', icon: '🃏', title: 'Teen Patti', desc: '3-card Indian poker vs AI', color: '#e91e63' },
  { path: '/rummy', icon: '🂡', title: 'Rummy', desc: 'Gin Rummy card game', color: '#4caf50' },
  { path: '/gofish', icon: '🐟', title: 'Go Fish', desc: 'Classic card matching game', color: '#29b6f6' },
  { path: '/checkers', icon: '⚫', title: 'Checkers', desc: 'Draughts vs smart AI', color: '#d32f2f' },
  { path: '/minesweeper', icon: '💣', title: 'Minesweeper', desc: 'Classic mine-sweeping puzzle', color: '#78909c' },
  { path: '/2048', icon: '🔢', title: '2048', desc: 'Slide & merge number tiles', color: '#f9a825' },
  { path: '/wordle', icon: '📝', title: 'Wordle', desc: 'Guess the 5-letter word', color: '#66bb6a' },
  { path: '/connectfour', icon: '🔴', title: 'Connect Four', desc: 'Drop discs, connect 4 to win', color: '#1565c0' },
  { path: '/sudoku', icon: '🔢', title: 'Sudoku', desc: '9×9 number puzzle', color: '#90caf9' },
  { path: '/memorymatch', icon: '🧠', title: 'Memory Match', desc: 'Flip & match emoji pairs', color: '#f48fb1' },
  { path: '/tetris', icon: '🧩', title: 'Tetris', desc: 'Classic falling blocks', color: '#00e5ff' },
  { path: '/spaceinvaders', icon: '👾', title: 'Space Invaders', desc: 'Shoot waves of aliens', color: '#69f0ae' },
  { path: '/hangman', icon: '🪢', title: 'Hangman', desc: 'Guess the hidden word', color: '#ffd740' },
  { path: '/typingtest', icon: '⌨️', title: 'Typing Test', desc: 'Test your typing speed', color: '#00e5ff' },
  { path: '/whackamole', icon: '🔨', title: 'Whack-a-Mole', desc: 'Click the moles fast!', color: '#ff6e40' },
  { path: '/simonsays', icon: '🔴', title: 'Simon Says', desc: 'Color sequence memory', color: '#ce93d8' },
  { path: '/towerofhanoi', icon: '🗼', title: 'Tower of Hanoi', desc: 'Classic disk puzzle', color: '#ffd740' },
  { path: '/reversi', icon: '⚫', title: 'Reversi', desc: 'Othello board game vs AI', color: '#69f0ae' },
  { path: '/doodlejump', icon: '🦘', title: 'Doodle Jump', desc: 'Endless vertical platformer', color: '#b9f6ca' },
  { path: '/reactiontest', icon: '⚡', title: 'Reaction Time', desc: 'Test your reflexes', color: '#ffd740' },
];

export default function MainMenu() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 80 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
        hue: Math.random() * 180 + 180,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;
        ctx.fill();
      }

      // draw connecting lines for nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,229,255,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="menu-root">
      <canvas ref={canvasRef} className="menu-particles" />
      <div className="menu-content">
        <h1 className="menu-title">
          <span className="title-glow">ARCADE</span>
        </h1>
        <p className="menu-subtitle">Choose a game to play</p>
        <div className="menu-cards">
          {games.map(g => (
            <button
              key={g.path}
              className="menu-card"
              style={{ '--card-color': g.color }}
              onClick={() => navigate(g.path)}
            >
              <span className="card-icon">{g.icon}</span>
              <h3>{g.title}</h3>
              <p>{g.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Flappy Bird Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

let gameStarted = false;
let gameOver = false;
let score = 0;

// Bird object
const bird = {
  x: 100,
  y: canvas.height / 2,
  width: 34,
  height: 24,
  velocity: 0,
  gravity: 0.5,
  jumpStrength: -8,
  rotation: 0
};

// Pipes array
let pipes = [];
const pipeWidth = 60;
const pipeGap = 150;
const pipeSpeed = 2;
let frameCount = 0;

// Colors
const skyColor = '#70C5CE';
const groundColor = '#DED895';
const pipeColor = '#5DBE3F';
const birdColor = '#F4D03F';

// Event listeners
document.addEventListener('keydown', onKeyDown);
canvas.addEventListener('click', flap);
document.getElementById('restart-btn').addEventListener('click', restart);

function onKeyDown(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!gameStarted) {
      gameStarted = true;
      document.getElementById('instructions').style.display = 'none';
    } else if (!gameOver) {
      flap();
    }
  }
}

function flap() {
  if (gameStarted && !gameOver) {
    bird.velocity = bird.jumpStrength;
  }
}

function createPipe() {
  const minHeight = 50;
  const maxHeight = canvas.height - pipeGap - 150;
  const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
  
  pipes.push({
    x: canvas.width,
    topHeight: topHeight,
    bottomY: topHeight + pipeGap,
    scored: false
  });
}

function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;
  
  // Rotation based on velocity
  if (bird.velocity < 0) {
    bird.rotation = -25;
  } else {
    bird.rotation = Math.min(90, bird.velocity * 3);
  }
  
  // Check ground collision
  if (bird.y + bird.height >= canvas.height - 50) {
    endGame();
  }
  
  // Check ceiling collision
  if (bird.y <= 0) {
    bird.y = 0;
    bird.velocity = 0;
  }
}

function updatePipes() {
  // Move pipes
  pipes.forEach((pipe, index) => {
    pipe.x -= pipeSpeed;
    
    // Check collision
    if (checkCollision(pipe)) {
      endGame();
    }
    
    // Score when passing pipe
    if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
      pipe.scored = true;
      score++;
      document.getElementById('score').textContent = score;
    }
    
    // Remove off-screen pipes
    if (pipe.x + pipeWidth < 0) {
      pipes.splice(index, 1);
    }
  });
  
  // Create new pipes
  frameCount++;
  if (frameCount % 90 === 0) {
    createPipe();
  }
}

function checkCollision(pipe) {
  // Check if bird is in pipe's x range
  if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth) {
    // Check if bird hits top or bottom pipe
    if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
      return true;
    }
  }
  return false;
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  ctx.rotate((bird.rotation * Math.PI) / 180);
  
  // Body
  ctx.fillStyle = birdColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Wing
  ctx.fillStyle = '#F39C12';
  ctx.beginPath();
  ctx.ellipse(-5, 5, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(8, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(10, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Beak
  ctx.fillStyle = '#E67E22';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(20, -2);
  ctx.lineTo(20, 2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function drawPipes() {
  pipes.forEach(pipe => {
    // Top pipe
    ctx.fillStyle = pipeColor;
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
    
    // Top pipe cap
    ctx.fillStyle = '#4E9D2D';
    ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
    
    // Bottom pipe
    ctx.fillStyle = pipeColor;
    ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY - 50);
    
    // Bottom pipe cap
    ctx.fillStyle = '#4E9D2D';
    ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
    
    // Pipe details
    ctx.strokeStyle = '#4E9D2D';
    ctx.lineWidth = 2;
    for (let i = 0; i < pipe.topHeight; i += 20) {
      ctx.beginPath();
      ctx.moveTo(pipe.x, i);
      ctx.lineTo(pipe.x + pipeWidth, i);
      ctx.stroke();
    }
    
    for (let i = pipe.bottomY; i < canvas.height - 50; i += 20) {
      ctx.beginPath();
      ctx.moveTo(pipe.x, i);
      ctx.lineTo(pipe.x + pipeWidth, i);
      ctx.stroke();
    }
  });
}

function drawBackground() {
  // Sky
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height - 50);
  
  // Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(80, 80, 30, 0, Math.PI * 2);
  ctx.arc(100, 70, 40, 0, Math.PI * 2);
  ctx.arc(130, 80, 30, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(280, 120, 25, 0, Math.PI * 2);
  ctx.arc(300, 115, 35, 0, Math.PI * 2);
  ctx.arc(330, 120, 25, 0, Math.PI * 2);
  ctx.fill();
  
  // Ground
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
  
  // Ground details
  ctx.fillStyle = '#C4B454';
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.fillRect(i, canvas.height - 50, 2, 50);
  }
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
  gameOver = false;
  gameStarted = false;
  score = 0;
  frameCount = 0;
  pipes = [];
  
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  bird.rotation = 0;
  
  document.getElementById('score').textContent = '0';
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('instructions').style.display = 'block';
}

function gameLoop() {
  // Clear canvas
  drawBackground();
  
  // Draw pipes
  drawPipes();
  
  // Draw bird
  drawBird();
  
  // Update game state
  if (gameStarted && !gameOver) {
    updateBird();
    updatePipes();
  }
  
  requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();

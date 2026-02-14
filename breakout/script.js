// Breakout Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

let gameStarted = false;
let gameOver = false;
let score = 0;
let lives = 3;
let level = 1;

// Paddle
const paddle = {
  x: canvas.width / 2 - 60,
  y: canvas.height - 30,
  width: 120,
  height: 15,
  speed: 8,
  dx: 0
};

// Ball
const ball = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  radius: 8,
  speed: 4,
  dx: 4,
  dy: -4,
  stuck: true
};

// Bricks
let bricks = [];
const brickRowCount = 6;
const brickColumnCount = 10;
const brickWidth = 70;
const brickHeight = 25;
const brickPadding = 5;
const brickOffsetTop = 50;
const brickOffsetLeft = 35;

const brickColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#FFD93D', '#6BCF7F', '#C780FA'
];

// Keys
const keys = {
  ArrowLeft: false,
  ArrowRight: false
};

// Event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
canvas.addEventListener('mousemove', onMouseMove);
document.getElementById('restart-btn').addEventListener('click', restart);

function onKeyDown(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!gameStarted) {
      gameStarted = true;
      ball.stuck = false;
      document.getElementById('instructions').style.display = 'none';
    }
  }
  
  if (e.code in keys) {
    keys[e.code] = true;
  }
}

function onKeyUp(e) {
  if (e.code in keys) {
    keys[e.code] = false;
  }
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  
  if (mouseX > paddle.width / 2 && mouseX < canvas.width - paddle.width / 2) {
    paddle.x = mouseX - paddle.width / 2;
  }
}

function createBricks() {
  bricks = [];
  for (let row = 0; row < brickRowCount; row++) {
    bricks[row] = [];
    for (let col = 0; col < brickColumnCount; col++) {
      bricks[row][col] = {
        x: brickOffsetLeft + col * (brickWidth + brickPadding),
        y: brickOffsetTop + row * (brickHeight + brickPadding),
        width: brickWidth,
        height: brickHeight,
        visible: true,
        color: brickColors[row % brickColors.length],
        points: (brickRowCount - row) * 10
      };
    }
  }
}

function drawPaddle() {
  // Paddle gradient
  const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
  gradient.addColorStop(0, '#3498db');
  gradient.addColorStop(1, '#2980b9');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  
  // Paddle border
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
  // Ball gradient
  const gradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, ball.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#e74c3c');
  
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function drawBricks() {
  bricks.forEach(row => {
    row.forEach(brick => {
      if (brick.visible) {
        // Brick with gradient
        const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        gradient.addColorStop(0, brick.color);
        gradient.addColorStop(1, adjustBrightness(brick.color, -30));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Brick border
        ctx.strokeStyle = adjustBrightness(brick.color, -50);
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        
        // Highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height / 2);
      }
    });
  });
}

function adjustBrightness(color, amount) {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function drawBackground() {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#2c3e50');
  gradient.addColorStop(1, '#34495e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
}

function updatePaddle() {
  if (keys.ArrowLeft && paddle.x > 0) {
    paddle.x -= paddle.speed;
  }
  if (keys.ArrowRight && paddle.x + paddle.width < canvas.width) {
    paddle.x += paddle.speed;
  }
}

function updateBall() {
  if (ball.stuck) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    return;
  }
  
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // Wall collisions
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx = -ball.dx;
  }
  
  if (ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
  }
  
  // Paddle collision
  if (
    ball.y + ball.radius > paddle.y &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    // Change angle based on where ball hits paddle
    const hitPos = (ball.x - paddle.x) / paddle.width;
    const angle = (hitPos - 0.5) * Math.PI / 3; // -60 to 60 degrees
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));
  }
  
  // Bottom wall - lose life
  if (ball.y + ball.radius > canvas.height) {
    lives--;
    updateLivesDisplay();
    
    if (lives <= 0) {
      endGame(false);
    } else {
      ball.stuck = true;
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius;
      ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
      ball.dy = -4;
    }
  }
  
  // Brick collision
  bricks.forEach(row => {
    row.forEach(brick => {
      if (brick.visible) {
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          ball.dy = -ball.dy;
          brick.visible = false;
          score += brick.points;
          document.getElementById('score').textContent = 'Score: ' + score;
          
          // Check level complete
          checkLevelComplete();
        }
      }
    });
  });
}

function checkLevelComplete() {
  const allBricksGone = bricks.every(row => row.every(brick => !brick.visible));
  
  if (allBricksGone) {
    level++;
    document.getElementById('level').textContent = 'Level: ' + level;
    ball.speed = Math.min(8, 4 + level * 0.3);
    createBricks();
    ball.stuck = true;
  }
}

function updateLivesDisplay() {
  const hearts = '❤️'.repeat(lives);
  document.getElementById('lives').textContent = 'Lives: ' + hearts;
}

function endGame(won) {
  gameOver = true;
  gameStarted = false;
  
  if (won) {
    document.getElementById('game-over-title').textContent = 'Victory!';
    document.getElementById('game-over-title').style.color = '#4CAF50';
  } else {
    document.getElementById('game-over-title').textContent = 'Game Over!';
    document.getElementById('game-over-title').style.color = '#FF4444';
  }
  
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-level').textContent = level;
  document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
  gameOver = false;
  gameStarted = false;
  score = 0;
  lives = 3;
  level = 1;
  
  paddle.x = canvas.width / 2 - 60;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 50;
  ball.dx = 4;
  ball.dy = -4;
  ball.stuck = true;
  ball.speed = 4;
  
  createBricks();
  
  document.getElementById('score').textContent = 'Score: 0';
  document.getElementById('level').textContent = 'Level: 1';
  updateLivesDisplay();
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('instructions').style.display = 'block';
}

function gameLoop() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
  
  if (gameStarted && !gameOver) {
    updatePaddle();
    updateBall();
  }
  
  requestAnimationFrame(gameLoop);
}

// Initialize
createBricks();
gameLoop();

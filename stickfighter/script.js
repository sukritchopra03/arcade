// Stickman Fighter Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameStarted = false;
let gameOver = false;
let score = 0;

// Player object
const player = {
  x: 200,
  y: canvas.height - 150,
  width: 20,
  height: 80,
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumpPower: 15,
  isJumping: false,
  health: 100,
  isAttacking: false,
  attackType: '',
  attackCooldown: 0,
  direction: 1 // 1 = right, -1 = left
};

// Enemy object
const enemy = {
  x: canvas.width - 300,
  y: canvas.height - 150,
  width: 20,
  height: 80,
  velocityX: 0,
  velocityY: 0,
  speed: 3,
  health: 100,
  isAttacking: false,
  attackCooldown: 0,
  aiTimer: 0,
  direction: -1
};

const gravity = 0.8;
const groundY = canvas.height - 70;

// Keys
const keys = {
  a: false,
  d: false,
  w: false,
  j: false,
  k: false
};

// Event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.getElementById('restart-btn').addEventListener('click', restart);
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

function onKeyDown(e) {
  const key = e.key.toLowerCase();
  
  if (e.code === 'Space' && !gameStarted) {
    gameStarted = true;
    document.getElementById('instructions').style.display = 'none';
  }
  
  if (!gameStarted || gameOver) return;
  
  if (key in keys) {
    keys[key] = true;
  }
  
  // Attack inputs
  if (key === 'j' && !player.isAttacking && player.attackCooldown <= 0) {
    player.isAttacking = true;
    player.attackType = 'punch';
    player.attackCooldown = 30;
  }
  
  if (key === 'k' && !player.isAttacking && player.attackCooldown <= 0) {
    player.isAttacking = true;
    player.attackType = 'kick';
    player.attackCooldown = 40;
  }
}

function onKeyUp(e) {
  const key = e.key.toLowerCase();
  if (key in keys) {
    keys[key] = false;
  }
}

// Draw stickman
function drawStickman(x, y, color, direction, isAttacking, attackType) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  // Head
  ctx.beginPath();
  ctx.arc(x, y - 60, 12, 0, Math.PI * 2);
  ctx.stroke();
  
  // Body
  ctx.beginPath();
  ctx.moveTo(x, y - 48);
  ctx.lineTo(x, y - 20);
  ctx.stroke();
  
  // Arms
  if (isAttacking && attackType === 'punch') {
    // Punching arm extended
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x + (direction * 25), y - 35);
    ctx.stroke();
    
    // Other arm
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x - (direction * 10), y - 30);
    ctx.stroke();
  } else if (isAttacking && attackType === 'kick') {
    // Normal arms
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x - 10, y - 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x + 10, y - 30);
    ctx.stroke();
  } else {
    // Normal arms
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x - 10, y - 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x + 10, y - 30);
    ctx.stroke();
  }
  
  // Legs
  if (isAttacking && attackType === 'kick') {
    // Kicking leg extended
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + (direction * 30), y - 10);
    ctx.stroke();
    
    // Standing leg
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - (direction * 5), y);
    ctx.stroke();
  } else {
    // Normal legs
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 10, y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + 10, y);
    ctx.stroke();
  }
}

// Update player
function updatePlayer() {
  // Horizontal movement
  if (keys.a) {
    player.velocityX = -player.speed;
    player.direction = -1;
  } else if (keys.d) {
    player.velocityX = player.speed;
    player.direction = 1;
  } else {
    player.velocityX = 0;
  }
  
  // Jump
  if (keys.w && !player.isJumping) {
    player.velocityY = -player.jumpPower;
    player.isJumping = true;
  }
  
  // Apply gravity
  player.velocityY += gravity;
  
  // Update position
  player.x += player.velocityX;
  player.y += player.velocityY;
  
  // Ground collision
  if (player.y >= groundY) {
    player.y = groundY;
    player.velocityY = 0;
    player.isJumping = false;
  }
  
  // Boundaries
  if (player.x < 50) player.x = 50;
  if (player.x > canvas.width - 50) player.x = canvas.width - 50;
  
  // Attack cooldown
  if (player.attackCooldown > 0) {
    player.attackCooldown--;
  }
  
  if (player.isAttacking) {
    checkPlayerAttack();
    setTimeout(() => {
      player.isAttacking = false;
    }, 200);
  }
}

// Simple AI for enemy
function updateEnemy() {
  enemy.aiTimer++;
  
  // AI behavior
  const distanceToPlayer = player.x - enemy.x;
  
  if (enemy.aiTimer > 60) {
    // Move towards player
    if (Math.abs(distanceToPlayer) > 80) {
      if (distanceToPlayer > 0) {
        enemy.velocityX = enemy.speed;
        enemy.direction = 1;
      } else {
        enemy.velocityX = -enemy.speed;
        enemy.direction = -1;
      }
    } else {
      enemy.velocityX = 0;
      
      // Attack randomly
      if (Math.random() < 0.05 && !enemy.isAttacking && enemy.attackCooldown <= 0) {
        enemy.isAttacking = true;
        enemy.attackCooldown = 40;
        checkEnemyAttack();
        setTimeout(() => {
          enemy.isAttacking = false;
        }, 200);
      }
    }
  }
  
  // Apply gravity
  enemy.velocityY += gravity;
  
  // Update position
  enemy.x += enemy.velocityX;
  enemy.y += enemy.velocityY;
  
  // Ground collision
  if (enemy.y >= groundY) {
    enemy.y = groundY;
    enemy.velocityY = 0;
  }
  
  // Boundaries
  if (enemy.x < 50) enemy.x = 50;
  if (enemy.x > canvas.width - 50) enemy.x = canvas.width - 50;
  
  // Attack cooldown
  if (enemy.attackCooldown > 0) {
    enemy.attackCooldown--;
  }
}

function checkPlayerAttack() {
  const attackRange = player.attackType === 'kick' ? 50 : 35;
  const distance = Math.abs(player.x - enemy.x);
  
  if (distance < attackRange && Math.abs(player.y - enemy.y) < 50) {
    const damage = player.attackType === 'kick' ? 15 : 10;
    enemy.health -= damage;
    score += damage;
    document.getElementById('score').textContent = 'Score: ' + score;
    updateHealthBars();
    
    if (enemy.health <= 0) {
      endGame(true);
    }
  }
}

function checkEnemyAttack() {
  const distance = Math.abs(player.x - enemy.x);
  
  if (distance < 40 && Math.abs(player.y - enemy.y) < 50) {
    player.health -= 12;
    updateHealthBars();
    
    if (player.health <= 0) {
      endGame(false);
    }
  }
}

function updateHealthBars() {
  document.getElementById('player-health').style.width = player.health + '%';
  document.getElementById('enemy-health').style.width = enemy.health + '%';
}

function endGame(playerWon) {
  gameOver = true;
  gameStarted = false;
  
  if (playerWon) {
    document.getElementById('game-over-title').textContent = 'Victory!';
    document.getElementById('game-over-title').style.color = '#4CAF50';
  } else {
    document.getElementById('game-over-title').textContent = 'Defeated!';
    document.getElementById('game-over-title').style.color = '#FF4444';
  }
  
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
  gameOver = false;
  gameStarted = false;
  score = 0;
  
  player.x = 200;
  player.y = groundY;
  player.health = 100;
  player.velocityX = 0;
  player.velocityY = 0;
  player.isAttacking = false;
  player.attackCooldown = 0;
  
  enemy.x = canvas.width - 300;
  enemy.y = groundY;
  enemy.health = 100;
  enemy.velocityX = 0;
  enemy.velocityY = 0;
  enemy.isAttacking = false;
  enemy.attackCooldown = 0;
  enemy.aiTimer = 0;
  
  updateHealthBars();
  document.getElementById('score').textContent = 'Score: 0';
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('instructions').style.display = 'block';
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw ground
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
  
  // Draw grass
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, canvas.height - 70, canvas.width, 10);
  
  // Draw player
  drawStickman(player.x, player.y, '#FF0000', player.direction, player.isAttacking, player.attackType);
  
  // Draw enemy
  drawStickman(enemy.x, enemy.y, '#0000FF', enemy.direction, enemy.isAttacking, 'punch');
}

function gameLoop() {
  if (gameStarted && !gameOver) {
    updatePlayer();
    updateEnemy();
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

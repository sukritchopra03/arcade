let userPaddle, computerPaddle, ball, board;
let ballX, ballY, ballSpeedX, ballSpeedY;
let userPaddleY, computerPaddleY;
let keys = { ArrowUp: false, ArrowDown: false };
let playerScore = 0;
let computerScore = 0;
let scoreEls = null;
let isPaused = false;

function init() {
    userPaddle = document.querySelector('.user-paddle');
    computerPaddle = document.querySelector('.computer-paddle');
    ball = document.querySelector('.ball');
    board = document.querySelector('.game-board');
    scoreEls = {
        player: document.querySelector('.player-score'),
        computer: document.querySelector('.computer-score')
    };

    ballSpeedX = -8;
    ballSpeedY = -6;

    // set initial positions
    ballX = board.offsetWidth / 2 -  ball.offsetWidth / 2;
    ballY = board.offsetHeight / 2 - ball.offsetHeight / 2;
    userPaddleY = board.offsetHeight / 2 - userPaddle.offsetHeight / 2;
    computerPaddleY = board.offsetHeight / 2 - computerPaddle.offsetHeight / 2;

    // keyboard handlers for smooth movement
    window.addEventListener('keydown', (e) => { if (e.key in keys) keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });

    requestAnimationFrame(updateGame);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function resetBall(toLeft) {
    ballX = board.offsetWidth / 2 - ball.offsetWidth / 2;
    ballY = board.offsetHeight / 2 - ball.offsetHeight / 2;
    ballSpeedX = toLeft ? -4 : 4;
    ballSpeedY = (Math.random() * 6 - 3);
}

function updateScoreDisplay() {
    if (!scoreEls) return;
    scoreEls.player.textContent = String(playerScore);
    scoreEls.computer.textContent = String(computerScore);
}

function scorePoint(who) {
    if (isPaused) return;
    isPaused = true;
    if (who === 'player') playerScore += 1;
    else computerScore += 1;
    updateScoreDisplay();
    // show ball in center for a short moment
    ballX = board.offsetWidth / 2 - ball.offsetWidth / 2;
    ballY = board.offsetHeight / 2 - ball.offsetHeight / 2;
    ballSpeedX = 0;
    ballSpeedY = 0;
    // resume after a short delay, serve toward the player who conceded (opponent)
    setTimeout(() => {
        if (who === 'player') resetBall(false); // player scored -> ball moves right toward computer
        else resetBall(true); // computer scored -> ball moves left toward player
        isPaused = false;
    }, 800);
}

function updateGame() {
    // paddle movement (user)
    const paddleSpeed = 6;
    if (keys.ArrowUp) userPaddleY -= paddleSpeed;
    if (keys.ArrowDown) userPaddleY += paddleSpeed;
    userPaddleY = clamp(userPaddleY, 0, board.offsetHeight - userPaddle.offsetHeight);

    // simple computer AI: move toward ball center
    const compCenter = computerPaddleY + computerPaddle.offsetHeight / 2;
    const ballCenterY = ballY + ball.offsetHeight / 2;
    const compSpeed = 4;
    if (compCenter < ballCenterY - 6) computerPaddleY += compSpeed;
    else if (compCenter > ballCenterY + 6) computerPaddleY -= compSpeed;
    computerPaddleY = clamp(computerPaddleY, 0, board.offsetHeight - computerPaddle.offsetHeight);

    // move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // top/bottom collision
    if (ballY <= 0) { ballY = 0; ballSpeedY *= -1; }
    if (ballY + ball.offsetHeight >= board.offsetHeight) { ballY = board.offsetHeight - ball.offsetHeight; ballSpeedY *= -1; }

    // paddle collisions
    // user paddle
    if (ballX <= userPaddle.offsetWidth) {
        if (ballY + ball.offsetHeight >= userPaddleY && ballY <= userPaddleY + userPaddle.offsetHeight) {
            ballX = userPaddle.offsetWidth; // prevent sticking
            ballSpeedX = Math.abs(ballSpeedX) + 0.3; // send right and speed up slightly
            // change vertical speed based on hit location
            const hitPos = (ballY + ball.offsetHeight / 2) - (userPaddleY + userPaddle.offsetHeight / 2);
            ballSpeedY = hitPos * 0.18;
        }
    }
    // computer paddle
    if (ballX + ball.offsetWidth >= board.offsetWidth - computerPaddle.offsetWidth) {
        if (ballY + ball.offsetHeight >= computerPaddleY && ballY <= computerPaddleY + computerPaddle.offsetHeight) {
            ballX = board.offsetWidth - computerPaddle.offsetWidth - ball.offsetWidth; // prevent sticking
            ballSpeedX = -Math.abs(ballSpeedX) - 0.3; // send left and speed up slightly
            const hitPos = (ballY + ball.offsetHeight / 2) - (computerPaddleY + computerPaddle.offsetHeight / 2);
            ballSpeedY = hitPos * 0.18;
        }
    }

    // out of bounds: award point and reset after pause
    if (!isPaused && ballX + ball.offsetWidth < 0) {
        scorePoint('computer');
    }
    if (!isPaused && ballX > board.offsetWidth) {
        scorePoint('player');
    }

    // apply positions
    userPaddle.style.top = `${userPaddleY}px`;
    computerPaddle.style.top = `${computerPaddleY}px`;
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;

    requestAnimationFrame(updateGame);
}

// start after load so layout metrics are correct
window.addEventListener('load', init);
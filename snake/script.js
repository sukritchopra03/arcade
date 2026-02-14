const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');
const grid = 20;
let snake, dir, food, running, score;

function init(){
  snake = [{x:8,y:8},{x:7,y:8},{x:6,y:8}]; dir = {x:1,y:0}; score=0; running=true; placeFood(); scoreEl.textContent=score; loop();
}

function placeFood(){
  food = {x:Math.floor(Math.random()* (canvas.width/grid)), y:Math.floor(Math.random()* (canvas.height/grid))};
}

function loop(){
  if(!running) return;
  requestAnimationFrame(loop);
  // slow down to ~10fps
  if(window._last && performance.now()-window._last < 100) return; window._last = performance.now();
  // move
  const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
  // wrap
  head.x = (head.x+canvas.width/grid)%(canvas.width/grid);
  head.y = (head.y+canvas.height/grid)%(canvas.height/grid);
  // collision
  if(snake.some(s=>s.x===head.x && s.y===head.y)){ running=false; return; }
  snake.unshift(head);
  // eat
  if(head.x===food.x && head.y===food.y){ score++; scoreEl.textContent=score; placeFood(); } else snake.pop();
  draw();
}

function draw(){ ctx.fillStyle='#061221'; ctx.fillRect(0,0,canvas.width,canvas.height);
  // food
  ctx.fillStyle='tomato'; ctx.fillRect(food.x*grid, food.y*grid, grid, grid);
  // snake
  ctx.fillStyle='#7ed957'; snake.forEach((s,i)=>{ ctx.fillStyle = i? '#6bb347':'#3e8f1e'; ctx.fillRect(s.x*grid, s.y*grid, grid-1, grid-1); });
}

window.addEventListener('keydown', e=>{
  if(e.key==='ArrowUp' && dir.y===0) dir={x:0,y:-1};
  if(e.key==='ArrowDown' && dir.y===0) dir={x:0,y:1};
  if(e.key==='ArrowLeft' && dir.x===0) dir={x:-1,y:0};
  if(e.key==='ArrowRight' && dir.x===0) dir={x:1,y:0};
});

restartBtn.onclick = ()=>{ running=true; init(); };
init();

const boardEl = document.getElementById('board');
const msgEl = document.getElementById('msg');
const restartBtn = document.getElementById('restart');
let board = Array(9).fill(null);
let player = 'X';

function render() {
  boardEl.innerHTML = '';
  board.forEach((v,i)=>{
    const c = document.createElement('div');
    c.className = 'cell';
    c.textContent = v||'';
    c.onclick = ()=>{ if(!v && !winner()) { board[i]=player; render(); if(!winner()) { cpuMove(); } else end(); } };
    boardEl.appendChild(c);
  });
}

function winner() {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const w of wins){const [a,b,c]=w; if(board[a] && board[a]===board[b] && board[a]===board[c]) return board[a];}
  return board.every(Boolean)?'T':null;
}

function end(){ const w=winner(); if(w==='T') msgEl.textContent='Tie'; else msgEl.textContent = w+' wins'; }

function cpuMove(){ // simple AI: win, block, else random
  // try win
  for(let i=0;i<9;i++) if(!board[i]){ board[i]='O'; if(winner()==='O') return render(); board[i]=null; }
  // try block
  for(let i=0;i<9;i++) if(!board[i]){ board[i]='X'; if(winner()==='X'){ board[i]='O'; return render(); } board[i]=null; }
  // else random
  const empties = board.map((v,i)=>v?null:i).filter(n=>n!==null);
  if(empties.length){ board[empties[Math.floor(Math.random()*empties.length)]]='O'; }
  render(); if(winner()) end();
}

restartBtn.onclick = ()=>{ board=Array(9).fill(null); msgEl.textContent='Your move (X)'; render(); };
render();

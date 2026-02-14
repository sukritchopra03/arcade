const resEl = document.getElementById('res');
const youEl = document.getElementById('you');
const cpuEl = document.getElementById('cpu');
let you = 0, cpu = 0;
document.querySelectorAll('.choices button').forEach(b => {
  b.onclick = () => play(b.dataset.m);
});

function play(choice) {
  const opts = ['rock', 'paper', 'scissors'];
  const cpuChoice = opts[Math.floor(Math.random() * 3)];
  if (choice === cpuChoice) { resEl.textContent = `Tie — CPU chose ${cpuChoice}`; }
  else if ((choice === 'rock' && cpuChoice === 'scissors') || (choice === 'paper' && cpuChoice === 'rock') || (choice === 'scissors' && cpuChoice === 'paper')) { you++; youEl.textContent = you; resEl.textContent = `You win — CPU chose ${cpuChoice}`; }
  else { cpu++; cpuEl.textContent = cpu; resEl.textContent = `You lose — CPU chose ${cpuChoice}`; }
}

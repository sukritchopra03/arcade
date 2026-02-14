// Solitaire Game
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

let deck = [];
let stock = [];
let waste = [];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], []];
let moves = 0;
let startTime = null;
let timerInterval = null;
let draggedCard = null;
let draggedFrom = null;

// Initialize game
function init() {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('play-again').addEventListener('click', newGame);
  document.getElementById('stock-pile').addEventListener('click', drawFromStock);
  
  newGame();
}

function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({
        suit: suit,
        rank: rank,
        faceUp: false,
        color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
      });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function newGame() {
  // Reset game state
  moves = 0;
  startTime = Date.now();
  waste = [];
  foundations = [[], [], [], []];
  tableau = [[], [], [], [], [], [], []];
  
  document.getElementById('moves').textContent = 'Moves: 0';
  document.getElementById('win-message').classList.add('hidden');
  
  // Create and shuffle deck
  createDeck();
  stock = [...deck];
  
  // Deal to tableau
  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      const card = stock.pop();
      if (i === j) {
        card.faceUp = true;
      }
      tableau[j].push(card);
    }
  }
  
  // Start timer
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  
  renderGame();
}

function updateTimer() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById('timer').textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function drawFromStock() {
  if (stock.length > 0) {
    const card = stock.pop();
    card.faceUp = true;
    waste.push(card);
    moves++;
    document.getElementById('moves').textContent = 'Moves: ' + moves;
  } else if (waste.length > 0) {
    // Reset stock from waste
    while (waste.length > 0) {
      const card = waste.pop();
      card.faceUp = false;
      stock.push(card);
    }
    moves++;
    document.getElementById('moves').textContent = 'Moves: ' + moves;
  }
  renderGame();
}

function renderGame() {
  // Render stock
  const stockPile = document.getElementById('stock-pile');
  stockPile.innerHTML = '';
  if (stock.length > 0) {
    stockPile.appendChild(createCardElement({ faceUp: false }));
  } else {
    stockPile.innerHTML = '<div class="empty-pile">↻</div>';
  }
  
  // Render waste
  const wastePile = document.getElementById('waste-pile');
  wastePile.innerHTML = '';
  if (waste.length > 0) {
    const card = waste[waste.length - 1];
    const cardEl = createCardElement(card);
    cardEl.draggable = true;
    cardEl.addEventListener('dragstart', (e) => handleDragStart(e, card, 'waste'));
    wastePile.appendChild(cardEl);
  }
  
  // Render foundations
  for (let i = 0; i < 4; i++) {
    const foundationPile = document.getElementById(`foundation-${i}`);
    foundationPile.innerHTML = '';
    
    if (foundations[i].length > 0) {
      const card = foundations[i][foundations[i].length - 1];
      foundationPile.appendChild(createCardElement(card));
    } else {
      foundationPile.innerHTML = `<div class="empty-pile">${suitSymbols[suits[i]]}</div>`;
    }
    
    foundationPile.addEventListener('dragover', handleDragOver);
    foundationPile.addEventListener('drop', (e) => handleDrop(e, 'foundation', i));
  }
  
  // Render tableau
  for (let i = 0; i < 7; i++) {
    const tableauPile = document.getElementById(`tableau-${i}`);
    tableauPile.innerHTML = '';
    
    if (tableau[i].length === 0) {
      tableauPile.innerHTML = '<div class="empty-pile tableau-empty">K</div>';
    } else {
      tableau[i].forEach((card, cardIndex) => {
        const cardEl = createCardElement(card);
        cardEl.style.top = `${cardIndex * 25}px`;
        cardEl.style.position = 'absolute';
        
        if (card.faceUp) {
          cardEl.draggable = true;
          cardEl.addEventListener('dragstart', (e) => handleDragStart(e, card, 'tableau', i, cardIndex));
        }
        
        tableauPile.appendChild(cardEl);
      });
    }
    
    tableauPile.addEventListener('dragover', handleDragOver);
    tableauPile.addEventListener('drop', (e) => handleDrop(e, 'tableau', i));
  }
}

function createCardElement(card) {
  const cardEl = document.createElement('div');
  cardEl.className = 'card';
  
  if (!card.faceUp) {
    cardEl.classList.add('face-down');
    cardEl.innerHTML = '<div class="card-back"></div>';
  } else {
    cardEl.classList.add(card.color);
    cardEl.innerHTML = `
      <div class="card-corner top-left">
        <div class="rank">${card.rank}</div>
        <div class="suit">${suitSymbols[card.suit]}</div>
      </div>
      <div class="card-center">${suitSymbols[card.suit]}</div>
      <div class="card-corner bottom-right">
        <div class="rank">${card.rank}</div>
        <div class="suit">${suitSymbols[card.suit]}</div>
      </div>
    `;
  }
  
  return cardEl;
}

function handleDragStart(e, card, source, pileIndex = null, cardIndex = null) {
  draggedCard = {
    card: card,
    source: source,
    pileIndex: pileIndex,
    cardIndex: cardIndex
  };
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e, destination, pileIndex) {
  e.preventDefault();
  
  if (!draggedCard) return;
  
  if (destination === 'foundation') {
    if (canMoveToFoundation(draggedCard.card, pileIndex)) {
      moveCard(draggedCard, 'foundation', pileIndex);
    }
  } else if (destination === 'tableau') {
    if (canMoveToTableau(draggedCard.card, pileIndex)) {
      moveCard(draggedCard, 'tableau', pileIndex);
    }
  }
  
  draggedCard = null;
}

function canMoveToFoundation(card, foundationIndex) {
  const foundation = foundations[foundationIndex];
  
  if (foundation.length === 0) {
    return card.rank === 'A' && suits[foundationIndex] === card.suit;
  }
  
  const topCard = foundation[foundation.length - 1];
  const rankIndex = ranks.indexOf(card.rank);
  const topRankIndex = ranks.indexOf(topCard.rank);
  
  return card.suit === topCard.suit && rankIndex === topRankIndex + 1;
}

function canMoveToTableau(card, tableauIndex) {
  const tableauPile = tableau[tableauIndex];
  
  if (tableauPile.length === 0) {
    return card.rank === 'K';
  }
  
  const topCard = tableauPile[tableauPile.length - 1];
  const rankIndex = ranks.indexOf(card.rank);
  const topRankIndex = ranks.indexOf(topCard.rank);
  
  return card.color !== topCard.color && rankIndex === topRankIndex - 1;
}

function moveCard(draggedInfo, destination, pileIndex) {
  let cardToMove = null;
  
  // Remove from source
  if (draggedInfo.source === 'waste') {
    cardToMove = waste.pop();
  } else if (draggedInfo.source === 'tableau') {
    const sourceTableau = tableau[draggedInfo.pileIndex];
    const cardsToMove = sourceTableau.splice(draggedInfo.cardIndex);
    
    if (destination === 'foundation' && cardsToMove.length === 1) {
      cardToMove = cardsToMove[0];
    } else if (destination === 'tableau') {
      tableau[pileIndex].push(...cardsToMove);
      moves++;
      document.getElementById('moves').textContent = 'Moves: ' + moves;
      flipTopCard(draggedInfo.pileIndex);
      renderGame();
      checkWin();
      return;
    } else {
      // Invalid move, restore cards
      sourceTableau.push(...cardsToMove);
      return;
    }
  }
  
  if (!cardToMove) return;
  
  // Add to destination
  if (destination === 'foundation') {
    foundations[pileIndex].push(cardToMove);
  } else if (destination === 'tableau') {
    tableau[pileIndex].push(cardToMove);
  }
  
  moves++;
  document.getElementById('moves').textContent = 'Moves: ' + moves;
  
  // Flip top card of source tableau if needed
  if (draggedInfo.source === 'tableau') {
    flipTopCard(draggedInfo.pileIndex);
  }
  
  renderGame();
  checkWin();
}

function flipTopCard(tableauIndex) {
  const tableauPile = tableau[tableauIndex];
  if (tableauPile.length > 0) {
    const topCard = tableauPile[tableauPile.length - 1];
    if (!topCard.faceUp) {
      topCard.faceUp = true;
    }
  }
}

function checkWin() {
  const totalCards = foundations.reduce((sum, foundation) => sum + foundation.length, 0);
  if (totalCards === 52) {
    clearInterval(timerInterval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('final-moves').textContent = moves;
    document.getElementById('win-message').classList.remove('hidden');
  }
}

init();

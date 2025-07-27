import { renderWord } from '../ui/render.js';

let gameRunning = false;

export function startGameLoop() {
  if (gameRunning) return;
  gameRunning = true;

  nextRound();
}

function nextRound() {
  const colors = ["red", "blue", "green"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const displayColor = colors[Math.floor(Math.random() * colors.length)];

  renderWord(randomColor, displayColor);

  // Platzhalter für zukünftige Modifier, Timer etc.
}

export function renderWord(text, color) {
  let container = document.getElementById("game");
  if (!container) {
    container = document.createElement("div");
    container.id = "game";
    container.style.textAlign = "center";
    container.style.fontSize = "48px";
    container.style.marginTop = "100px";
    document.body.appendChild(container);
  }

  container.textContent = text;
  container.style.color = color;
}

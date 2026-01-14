export const canvas = document.getElementById("gameCanvas");
export const ctx = canvas.getContext("2d");

function resizeCanvasToWindow() {
  const dpr = window.devicePixelRatio || 1;

  // KEIN .style.width oder .style.height hier
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

window.addEventListener("resize", resizeCanvasToWindow);
resizeCanvasToWindow();

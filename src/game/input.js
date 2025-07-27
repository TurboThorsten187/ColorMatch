export function initInput() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      console.log("Eingabe: Links (True)");
    } else if (e.key === "ArrowRight") {
      console.log("Eingabe: Rechts (False)");
    }
  });

  document.addEventListener("click", (e) => {
    const x = e.clientX;
    if (x < window.innerWidth / 2) {
      console.log("Touch/Klick: Links");
    } else {
      console.log("Touch/Klick: Rechts");
    }
  });
}

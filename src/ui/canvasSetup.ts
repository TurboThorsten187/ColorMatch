function getCanvas(): HTMLCanvasElement {
    const element = document.getElementById("gameCanvas");
    if (!(element instanceof HTMLCanvasElement)) {
        throw new Error("Canvas #gameCanvas not found");
    }
    return element;
}

function getContext(target: HTMLCanvasElement): CanvasRenderingContext2D {
    const context = target.getContext("2d");
    if (!context) {
        throw new Error("2D canvas context not available");
    }
    return context;
}

export const canvas = getCanvas();
export const ctx = getContext(canvas);

// Größe des Canvas in CSS-Pixeln. Alle Render-Funktionen zeichnen in diesen Koordinaten,
// die Umrechnung auf echte Gerätepixel übernimmt die Transformation aus resizeCanvasToWindow().
export const viewport = { width: 0, height: 0 };

function resizeCanvasToWindow(): void {
    const dpr = window.devicePixelRatio || 1;

    // Die angezeigte Größe kommt aus dem CSS, hier wird nur die Auflösung angepasst
    viewport.width = canvas.clientWidth;
    viewport.height = canvas.clientHeight;
    canvas.width = Math.round(viewport.width * dpr);
    canvas.height = Math.round(viewport.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvasToWindow);
resizeCanvasToWindow();

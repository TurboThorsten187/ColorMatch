import { ctx } from "./canvasSetup.ts";

export interface TextLine {
    text: string;
    fontSize: number;
}

// Faktor (≤ 1), mit dem alle Schriftgrößen multipliziert werden müssen,
// damit jede Zeile höchstens maxWidth breit ist (z. B. auf Handys im Hochformat).
export function fitText(lines: readonly TextLine[], maxWidth: number, fontFamily = "sans-serif"): number {
    let widest = 0;
    for (const line of lines) {
        ctx.font = `bold ${line.fontSize}px ${fontFamily}`;
        widest = Math.max(widest, ctx.measureText(line.text).width);
    }
    return widest > maxWidth ? maxWidth / widest : 1;
}

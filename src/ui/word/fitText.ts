export interface TextLine {
    readonly text: string;
    readonly fontSize: number;
}

let measureContext: CanvasRenderingContext2D | null = null;

// Width in px of one line, measured with the same font the DOM renders with
export function textWidth(line: TextLine, fontFamily: string, fontWeight: number | string = "bold"): number {
    measureContext ??= document.createElement("canvas").getContext("2d");
    if (!measureContext) {
        throw new Error("2D canvas context for text measurement not available");
    }

    measureContext.font = `${fontWeight} ${line.fontSize}px ${fontFamily}`;
    return measureContext.measureText(line.text).width;
}

// Factor (≤ 1) to multiply all font sizes with so that every line is at most maxWidth wide,
// e.g. on phones in portrait mode.
export function fitScale(
    lines: readonly TextLine[],
    maxWidth: number,
    fontFamily: string,
    fontWeight: number | string = "bold",
): number {
    const widest = Math.max(0, ...lines.map((line) => textWidth(line, fontFamily, fontWeight)));
    return widest > maxWidth ? maxWidth / widest : 1;
}

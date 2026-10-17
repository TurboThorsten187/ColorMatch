export interface TextLine {
    readonly text: string;
    readonly fontSize: number;
}

let measureContext: CanvasRenderingContext2D | null = null;

// Factor (≤ 1) to multiply all font sizes with so that every line is at most maxWidth wide,
// e.g. on phones in portrait mode. Measures with the same font the DOM renders with.
export function fitScale(
    lines: readonly TextLine[],
    maxWidth: number,
    fontFamily: string,
    fontWeight: number | string = "bold",
): number {
    measureContext ??= document.createElement("canvas").getContext("2d");
    if (!measureContext) {
        throw new Error("2D canvas context for text measurement not available");
    }

    let widest = 0;
    for (const line of lines) {
        measureContext.font = `${fontWeight} ${line.fontSize}px ${fontFamily}`;
        widest = Math.max(widest, measureContext.measureText(line.text).width);
    }
    return widest > maxWidth ? maxWidth / widest : 1;
}

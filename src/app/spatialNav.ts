// Moving the keyboard selection between the buttons of a screen by where they are, like a cursor in an arcade menu

export type Direction = "up" | "down" | "left" | "right";

export interface Box {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
}

const centerX = (box: Box): number => box.left + box.width / 2;
const centerY = (box: Box): number => box.top + box.height / 2;

// Boxes that share some height are in the same row
function sameRow(a: Box, b: Box): boolean {
    return a.top < b.top + b.height && b.top < a.top + a.height;
}

function nearest(indexes: readonly number[], distance: (index: number) => number): number | null {
    let best: number | null = null;
    for (const index of indexes) {
        if (best === null || distance(index) < distance(best)) best = index;
    }
    return best;
}

// Left and right stay in the row; up and down go to the next row and pick the box closest to the side.
// Returns the index of the box to select, or null at the edge.
export function neighbor(boxes: readonly Box[], from: number, direction: Direction): number | null {
    const source = boxes[from];
    const others = boxes.map((_, index) => index).filter((index) => index !== from);

    if (direction === "left" || direction === "right") {
        const sign = direction === "right" ? 1 : -1;
        const along = (index: number): number => sign * (centerX(boxes[index]) - centerX(source));
        return nearest(
            others.filter((index) => sameRow(boxes[index], source) && along(index) > 0),
            along,
        );
    }

    const sign = direction === "down" ? 1 : -1;
    const along = (index: number): number => sign * (centerY(boxes[index]) - centerY(source));
    const ahead = others.filter((index) => !sameRow(boxes[index], source) && along(index) > 0);
    const next = nearest(ahead, along);
    if (next === null) return null;
    return nearest(
        ahead.filter((index) => sameRow(boxes[index], boxes[next])),
        (index) => Math.abs(centerX(boxes[index]) - centerX(source)),
    );
}

// Award toasts are shown one after another: each entry is visible from `at` for TOAST_MS

export const TOAST_MS = 1600;

export interface QueuedToast<T> {
    readonly item: T;
    readonly at: number;
}

export type ToastQueue<T> = readonly QueuedToast<T>[];

// Appends new toasts after the last waiting one and drops the ones that are already over
export function enqueue<T>(queue: ToastQueue<T>, items: readonly T[], now: number): ToastQueue<T> {
    const waiting = queue.filter((entry) => entry.at + TOAST_MS > now);
    const last = waiting.at(-1);
    const firstAt = last ? Math.max(now, last.at + TOAST_MS) : now;
    return [...waiting, ...items.map((item, index) => ({ item, at: firstAt + index * TOAST_MS }))];
}

// While the game is paused the toasts are hidden, so the ones not over yet wait for the pause duration
export function delay<T>(queue: ToastQueue<T>, pausedAt: number, pausedFor: number): ToastQueue<T> {
    return queue.map((entry) => (entry.at + TOAST_MS > pausedAt ? { ...entry, at: entry.at + pausedFor } : entry));
}

export function visible<T>(queue: ToastQueue<T>, now: number): QueuedToast<T> | null {
    return queue.find((entry) => now >= entry.at && now < entry.at + TOAST_MS) ?? null;
}

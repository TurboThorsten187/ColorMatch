import { type Rng, seededRng } from "@/core/random.ts";

// Browser tests play the same game every time: test builds (`npm run build:e2e`) and the dev server take a fixed seed
// from the URL, e.g. `?seed=42`. Production builds leave this out.
export function testRng(): Rng | null {
    if (import.meta.env.MODE === "production") return null;
    const seed = Number.parseInt(new URLSearchParams(window.location.search).get("seed") ?? "", 10);
    return Number.isNaN(seed) ? null : seededRng(seed);
}

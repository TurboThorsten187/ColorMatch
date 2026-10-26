// The Play Console's achievement import, made from the game's awards: photographs every award badge as a 512 x 512
// icon (src/ui/dev/AwardIcons.svelte on a dev server) and writes the CSV files next to them into
// dist-store/achievements/. Zip the files of that folder (no subfolder) and import them under Play Games Services,
// Achievements, Import achievements. CHROMIUM_PATH points to an installed Chromium, as for the e2e tests.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const OUT = "dist-store/achievements";
const PORT = 5199;
const SIZE = 512;
const COLUMNS = 6;

// Play Games points, multiples of 5 and at most 1000 for the whole game: the milestones grow, every other award is
// worth the same
const POINTS = { level10: 10, level25: 20, level50: 40, level100: 80, surge: 40 };
const OTHER_POINTS = 20;

function csvValue(text) {
    // The import knows no quoting
    if (text.includes(",")) throw new Error(`No commas allowed in the achievement import: ${text}`);
    return text;
}

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
    const page = await browser.newPage({ viewport: { width: SIZE * COLUMNS, height: SIZE * 5 } });
    await page.goto(`http://localhost:${PORT}/?awardIcons`);
    const tiles = page.locator("[data-award]");
    await tiles.first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const awards = await tiles.evaluateAll((elements) =>
        elements.map((element) => ({
            id: element.dataset.award,
            name: element.dataset.name,
            rule: element.dataset.rule,
        })),
    );

    await rm(OUT, { recursive: true, force: true });
    await mkdir(OUT, { recursive: true });
    for (const award of awards) {
        await tiles.and(page.locator(`[data-award="${award.id}"]`)).screenshot({ path: `${OUT}/${award.id}.png` });
    }
    // Name, description, incremental, steps, initial state, points, list order; no header row
    const metadata = awards.map((award, index) => [
        csvValue(award.name),
        csvValue(award.rule),
        "False",
        "",
        "Revealed",
        POINTS[award.id] ?? OTHER_POINTS,
        index + 1,
    ]);
    await writeFile(`${OUT}/AchievementsMetadata.csv`, metadata.map((row) => row.join(",")).join("\n") + "\n");
    const icons = awards.map((award) => `${award.name},${award.id}.png`);
    await writeFile(`${OUT}/AchievementsIconsMappings.csv`, icons.join("\n") + "\n");
    console.log(`${awards.length} achievements written to ${OUT}`);
} finally {
    await browser.close();
    await server.close();
}

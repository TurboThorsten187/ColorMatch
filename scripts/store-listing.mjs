// The Play Store listing's graphics, made from the game itself on a dev server: the 512 x 512 icon (public/favicon.svg),
// the 1024 x 500 feature graphic (src/ui/dev/FeatureGraphic.svelte) and the phone screenshots at 1080 x 1920 (9:16, as
// Play wants them for games), written into dist-store/listing/. Level scenes come from the modifier gallery
// (?gallery=…&screen), the menu and stats from the game with a prepared save. First it checks the texts in store/
// against Play's limits. CHROMIUM_PATH points to an installed Chromium, as for the e2e tests.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

// Play's limits in characters
const TEXT_LIMITS = { "title.txt": 30, "short-description.txt": 80, "full-description.txt": 4000 };
for (const locale of ["en-US", "de-DE"]) {
    for (const [file, limit] of Object.entries(TEXT_LIMITS)) {
        const length = [...(await readFile(`store/${locale}/${file}`, "utf8")).trim()].length;
        if (length > limit) throw new Error(`store/${locale}/${file} has ${length} characters, Play allows ${limit}`);
    }
}

const OUT = "dist-store/listing";
const PORT = 5198;
// 360 x 640 CSS pixels at three device pixels each
const PHONE = { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const HIGHSCORE = 64;

// A player who knows the game: tutorial done, hardcore open, some awards
const SAVE = {
    version: 1,
    highscores: { normal: HIGHSCORE, hardcore: 21 },
    stats: {
        games: 48,
        levelSum: 1290,
        reactionSum: 713_000,
        reactionCount: 1150,
        playMs: 2_940_000,
        clears: {},
        awards: ["level10", "level25", "level50", "surge", "mirror", "rotation", "pulsing", "shaky", "blur"],
    },
    progress: { done: true, seenIntros: [] },
};

// In the order the listing shows them
const SCENES = [
    { name: "level-rotation", gallery: "rotation,background&level=22&t=700&seed=6" },
    { name: "level-font-flip", gallery: "fontFlip,mirror&level=30&t=600&seed=2" },
    { name: "intro-card", intro: "fontFlip" },
    { name: "level-duo", gallery: "twoWords&level=30&t=600&seed=7" },
    { name: "menu", screen: "menu" },
    { name: "level-negative", gallery: "negative,shaky&level=40&t=500&seed=6" },
    { name: "level-colorblind", gallery: "rotation,background&level=22&t=700&colorblind&seed=4" },
    { name: "stats", screen: "STATS" },
];

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: "error" });
await server.listen();
const base = `http://localhost:${PORT}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
    await rm(OUT, { recursive: true, force: true });
    await mkdir(OUT, { recursive: true });

    // Play wants a 32-bit PNG with an alpha channel, which a canvas writes; a screenshot of the opaque icon has none
    const iconPage = await browser.newPage();
    await iconPage.goto(`${base}/favicon.svg`);
    const icon = await iconPage.evaluate(async () => {
        const image = new Image();
        image.src = "favicon.svg";
        await image.decode();
        // The page is the SVG document, a canvas needs the HTML namespace
        const canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
        canvas.width = 512;
        canvas.height = 512;
        canvas.getContext("2d").drawImage(image, 0, 0, 512, 512);
        return canvas.toDataURL("image/png");
    });
    await writeFile(`${OUT}/icon.png`, Buffer.from(icon.split(",")[1], "base64"));
    await iconPage.close();

    const featurePage = await browser.newPage({ viewport: { width: 1024, height: 500 } });
    await featurePage.goto(`${base}/?featureGraphic`);
    await featurePage.evaluate(() => document.fonts.ready);
    await featurePage.locator("[data-feature-graphic]").screenshot({ path: `${OUT}/feature-graphic.png` });
    await featurePage.close();

    const context = await browser.newContext(PHONE);
    await context.addInitScript((save) => localStorage.setItem("colormatch_save", JSON.stringify(save)), SAVE);
    for (const [index, scene] of SCENES.entries()) {
        const page = await context.newPage();
        if (scene.gallery) await page.goto(`${base}/?gallery=${scene.gallery}&screen&highscore=${HIGHSCORE}`);
        else if (scene.intro) await page.goto(`${base}/?gallery&intro=${scene.intro}&t=1200`);
        else {
            await page.goto(base);
            const start = page.getByRole("button", { name: "START GAME", exact: true });
            await start.waitFor();
            if (scene.screen !== "menu") await page.getByRole("button", { name: scene.screen, exact: true }).click();
        }
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts.ready);
        // The buttons' press animation and the fonts settle
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${OUT}/${index + 1}-${scene.name}.png` });
        await page.close();
    }
    console.log(`Icon, feature graphic and ${SCENES.length} screenshots written to ${OUT}`);
} finally {
    await browser.close();
    await server.close();
}

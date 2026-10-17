import { mount } from "svelte";
import App from "./App.svelte";
import { loadFonts } from "./ui/fonts.ts";
import "./app.css";

const target = document.getElementById("app");
if (!target) {
    throw new Error("Mount point #app not found");
}

await loadFonts();
mount(App, { target });

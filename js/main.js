import { CONFIG } from "./config.js";
import { chapters } from "./data/chapters.js";
import { Game } from "./engine/Game.js";

const canvas = document.querySelector("#gameCanvas");

const game = new Game({
  canvas,
  chapters,
  config: CONFIG
});

game.start();

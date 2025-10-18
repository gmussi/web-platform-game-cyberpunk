import { GameData, Character, Characters } from "../types/game";

// Game data
export const gameData: GameData = {
  selectedCharacter: null,
  playerHealth: 100,
  maxHealth: 100,
  scrollDirection: "right", // Always scroll right
};

// Character definitions
export const characters: Characters = {
  biker: {
    name: "Biker",
    color: 0xff4444,
    scrollDirection: "right",
  },
  punk: {
    name: "Punk",
    color: 0xff00ff,
    scrollDirection: "right",
  },
  cyborg: {
    name: "Cyborg",
    color: 0x00ffff,
    scrollDirection: "right",
  },
};

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
  A: {
    name: "Cyber Warrior",
    color: 0xff4444,
    scrollDirection: "right",
  },
  B: {
    name: "Quantum Mage",
    color: 0x8844ff,
    scrollDirection: "right",
  },
  C: {
    name: "Stealth Rogue",
    color: 0x2244aa,
    scrollDirection: "right",
  },
  D: {
    name: "Plasma Paladin",
    color: 0xffaa00,
    scrollDirection: "right",
  },
};

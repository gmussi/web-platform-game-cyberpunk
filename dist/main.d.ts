interface GameData {
    selectedCharacter: string | null;
    playerHealth: number;
    maxHealth: number;
    scrollDirection: "right";
}
interface Character {
    name: string;
    color: number;
    scrollDirection: "right";
}
interface Characters {
    [key: string]: Character;
}
export declare const gameData: GameData;
export declare const characters: Characters;
export {};
//# sourceMappingURL=main.d.ts.map
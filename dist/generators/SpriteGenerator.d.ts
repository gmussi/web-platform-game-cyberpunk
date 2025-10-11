export declare class SpriteGenerator {
    static generateHeroSprites(scene: Phaser.Scene): {
        [key: string]: string;
    };
    static generateRobotSprites(scene: Phaser.Scene): {
        [key: string]: string;
    };
    static generateAllSprites(scene: Phaser.Scene): {
        heroes: {
            [key: string]: string;
        };
        robots: {
            [key: string]: string;
        };
    };
    static createCyberWarrior(scene: Phaser.Scene): string;
    static createQuantumMage(scene: Phaser.Scene): string;
    static createStealthRogue(scene: Phaser.Scene): string;
    static createPlasmaPaladin(scene: Phaser.Scene): string;
    static createStationaryRobot(scene: Phaser.Scene): string;
    static createMovingRobot(scene: Phaser.Scene): string;
}
//# sourceMappingURL=SpriteGenerator.d.ts.map
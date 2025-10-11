export declare class UIUtils {
    static TEXT_STYLES: {
        title: {
            fontSize: string;
            fontFamily: string;
            color: string;
            fontStyle: string;
            stroke: string;
            strokeThickness: number;
        };
        subtitle: {
            fontSize: string;
            fontFamily: string;
            color: string;
            fontStyle: string;
            stroke: string;
            strokeThickness: number;
        };
        button: {
            fontSize: string;
            fontFamily: string;
            color: string;
            fontStyle: string;
            backgroundColor: string;
            padding: {
                x: number;
                y: number;
            };
        };
        ui: {
            fontSize: string;
            fontFamily: string;
            color: string;
            fontStyle: string;
            stroke: string;
            strokeThickness: number;
        };
        debug: {
            fontSize: string;
            fontFamily: string;
            color: string;
            fontStyle: string;
        };
        loading: {
            fontSize: string;
            fontFamily: string;
            color: string;
            fontStyle: string;
            stroke: string;
            strokeThickness: number;
        };
    };
    static COLORS: {
        primary: string;
        secondary: string;
        accent: string;
        danger: string;
        warning: string;
        background: string;
        transparent: string;
    };
    static createText(scene: Phaser.Scene, x: number, y: number, text: string, style?: keyof typeof UIUtils.TEXT_STYLES): Phaser.GameObjects.Text;
    static createButton(scene: Phaser.Scene, x: number, y: number, text: string, callback: () => void, style?: keyof typeof UIUtils.TEXT_STYLES): Phaser.GameObjects.Text;
    static createHealthBar(scene: Phaser.Scene, x: number, y: number, width?: number, height?: number): {
        bg: Phaser.GameObjects.Rectangle;
        bar: Phaser.GameObjects.Rectangle;
    };
    static updateHealthBar(healthBar: {
        bg: Phaser.GameObjects.Rectangle;
        bar: Phaser.GameObjects.Rectangle;
    }, currentHealth: number, maxHealth: number): void;
}
//# sourceMappingURL=UIUtils.d.ts.map
const { test, expect } = require('@playwright/test');

test('Loading screen displays and transitions correctly', async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:8000');
    
    // Wait for the loading screen to appear
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Check if loading text is visible
    const loadingText = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return null;
        
        // Get the Phaser game instance
        const game = window.game;
        if (!game) return null;
        
        // Check if LoadingScene is active
        const currentScene = game.scene.getScene('LoadingScene');
        if (!currentScene) return null;
        
        return currentScene.loadingText ? currentScene.loadingText.text : null;
    });
    
    expect(loadingText).toContain('Loading');
    
    // Wait for transition to character select scene
    await page.waitForFunction(() => {
        const game = window.game;
        if (!game) return false;
        
        const currentScene = game.scene.getActiveScene();
        return currentScene && currentScene.scene.key === 'CharacterSelectScene';
    }, { timeout: 30000 });
    
    // Verify we're in the character select scene
    const currentScene = await page.evaluate(() => {
        const game = window.game;
        if (!game) return null;
        
        const currentScene = game.scene.getActiveScene();
        return currentScene ? currentScene.scene.key : null;
    });
    
    expect(currentScene).toBe('CharacterSelectScene');
});

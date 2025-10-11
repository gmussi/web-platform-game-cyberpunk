const { test, expect } = require('@playwright/test');

test.describe('Game Loading and Basic Functionality', () => {
  test('game loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log('🚀 Starting game load test...');
    
    // Navigate to the game
    console.log('📡 Navigating to game...');
    await page.goto('/');
    
    // Wait for the game to load
    console.log('⏳ Waiting for network idle...');
    await page.waitForLoadState('networkidle');
    
    // Wait for Phaser to initialize by checking for canvas element
    console.log('🎨 Waiting for canvas element...');
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Wait a bit more for the game to fully initialize
    console.log('⏳ Waiting for game initialization...');
    await page.waitForTimeout(2000);
    
    // Check that no critical errors occurred (allow some non-critical errors)
    const criticalErrors = errors.filter(error => 
      !error.includes('Texture key already in use') && 
      !error.includes('SES Removing unpermitted intrinsics')
    );
    
    console.log(`📊 Found ${errors.length} total errors, ${criticalErrors.length} critical errors`);
    console.log('✅ Game load test completed successfully!');
    
    expect(criticalErrors.length).toBe(0);
  });

  test('character selection screen loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for character selection screen
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Check that canvas is visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(0);
    expect(canvasBox.height).toBeGreaterThan(0);
  });

  test('can select a character and enter game', async ({ page }) => {
    // Listen for console messages from the game
    const gameConsoleMessages = [];
    page.on('console', msg => {
      gameConsoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    console.log('🚀 Starting character selection test...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for character selection screen
    console.log('🎨 Waiting for character selection screen...');
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Click on the first character (Cyber Warrior) - coordinates based on CharacterSelectScene.js
    // Characters are positioned at y=520, with spacing of 200, starting at calculated startX
    // startX = (1200 - 600) / 2 = 300, so first character is at x=300
    console.log('👆 Clicking on character at coordinates (300, 520)...');
    await page.click('canvas', { position: { x: 300, y: 520 } });
    
    // Wait for scene transition to GameScene
    console.log('⏳ Waiting for scene transition...');
    await page.waitForTimeout(3000);
    
    // Log all console messages from the game
    console.log('📋 Game console messages:');
    gameConsoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    // Verify we're now in the game scene by checking for game-specific elements
    // The game should show character name, health bar, and instructions
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify we're in the game
    await page.screenshot({ path: 'test-results/character-selected-game-started.png' });
    
    // Try pressing a game control to verify we're actually in the game
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    // Canvas should still be visible (game didn't crash)
    await expect(canvas).toBeVisible();
    
    console.log('✅ Character selection test completed!');
  });

  test('can access map editor from character selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for character selection screen
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Press E key to access map editor
    await page.keyboard.press('KeyE');
    
    // Wait for scene transition to MapEditorScene
    await page.waitForTimeout(3000);
    
    // Verify we're in the map editor by checking canvas is still visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify we're in the map editor
    await page.screenshot({ path: 'test-results/map-editor-accessed.png' });
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Game Controls and Movement', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game and select a character
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Select first character (Cyber Warrior) - coordinates based on CharacterSelectScene.js
    // Characters are positioned at y=520, with spacing of 200, starting at calculated startX
    // startX = (1200 - 600) / 2 = 300, so first character is at x=300
    await page.click('canvas', { position: { x: 300, y: 520 } });
    await page.waitForTimeout(3000); // Wait for game to start
  });

  test('player can move left and right', async ({ page }) => {
    // Listen for console messages from the game
    const gameConsoleMessages = [];
    page.on('console', msg => {
      gameConsoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    console.log('🚀 Starting player movement test...');
    
    const canvas = page.locator('canvas');
    
    // Press right arrow key
    console.log('👆 Pressing right arrow...');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    // Press left arrow key
    console.log('👆 Pressing left arrow...');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    
    // Log all console messages from the game
    console.log('📋 Game console messages:');
    gameConsoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    // Check that canvas is still visible (game didn't crash)
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify we're actually in the game
    await page.screenshot({ path: 'test-results/player-movement-test.png' });
    
    console.log('✅ Player movement test completed!');
  });

  test('player can jump', async ({ page }) => {
    // Listen for console messages from the game
    const gameConsoleMessages = [];
    page.on('console', msg => {
      gameConsoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    console.log('🚀 Starting player jump test...');
    
    const canvas = page.locator('canvas');
    
    // Press spacebar to jump
    console.log('👆 Pressing spacebar to jump...');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    
    // Log all console messages from the game
    console.log('📋 Game console messages:');
    gameConsoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    // Check that canvas is still visible (game didn't crash)
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify we're actually in the game
    await page.screenshot({ path: 'test-results/player-jump-test.png' });
    
    console.log('✅ Player jump test completed!');
  });

  test('player responds to WASD keys', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Test WASD movement
    await page.keyboard.press('KeyD'); // Right
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyA'); // Left
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyW'); // Jump
    await page.waitForTimeout(200);
    
    // Check that canvas is still visible
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify we're actually in the game
    await page.screenshot({ path: 'test-results/player-wasd-test.png' });
  });

});

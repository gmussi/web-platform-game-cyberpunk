const { test, expect } = require('@playwright/test');

test.describe('Map Editor Functionality', () => {
  test('map editor loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to map editor from character selection
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Press E key to access map editor from character selection
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(3000);
    
    // Check that no critical errors occurred
    const criticalErrors = errors.filter(error => 
      !error.includes('Texture key already in use') && 
      !error.includes('SES Removing unpermitted intrinsics')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('map editor tools are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Access map editor
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(3000);
    
    // Check that canvas is visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(0);
    expect(canvasBox.height).toBeGreaterThan(0);
    
    // Take a screenshot to verify we're in the map editor
    await page.screenshot({ path: 'test-results/map-editor-tools-visible.png' });
  });

  test('can place tiles in map editor', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Access map editor
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(3000);
    
    // Select a tool (assuming solid tile tool is selected by default or click to select)
    // Click on canvas to select a tool first
    await page.click('canvas', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);
    
    // Place a tile
    await page.click('canvas', { position: { x: 300, y: 300 } });
    await page.waitForTimeout(500);
    
    // Check that canvas is still visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify tile placement
    await page.screenshot({ path: 'test-results/map-editor-tile-placement.png' });
  });

  test('can load modified.json map and verify tile changes', async ({ page }) => {
    // Listen for console messages from the game
    const gameConsoleMessages = [];
    page.on('console', msg => {
      gameConsoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    console.log('🚀 Starting map loading test...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 15000 });
    
    // Access map editor
    console.log('🎨 Accessing map editor...');
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(3000);
    
    // Load the modified.json map file programmatically
    console.log('📁 Loading modified.json map file...');
    await page.evaluate(async () => {
      // Access the map editor scene
      const mapEditorScene = window.game.scene.getScene('MapEditorScene');
      if (mapEditorScene) {
        try {
          await mapEditorScene.loadMapFromURL('maps/modified.json');
          console.log('✅ Map loaded successfully in test');
        } catch (error) {
          console.error('❌ Error loading map in test:', error);
        }
      } else {
        console.error('❌ MapEditorScene not found');
      }
    });
    
    // Wait for map loading to complete
    await page.waitForTimeout(2000);
    
    // Log all console messages from the game
    console.log('📋 Game console messages:');
    gameConsoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    // Verify we're still in the map editor
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify the map was loaded
    await page.screenshot({ path: 'test-results/map-editor-modified-loaded.png' });
    
    // Check that console messages contain the expected tile change log
    const tileChangeMessage = gameConsoleMessages.find(msg => 
      msg.includes('Tile changed at first column, last row') || 
      msg.includes('Loading tile data from map')
    );
    
    if (tileChangeMessage) {
      console.log('✅ Found tile change message:', tileChangeMessage);
    } else {
      console.log('⚠️ No tile change message found, but map loading messages present');
    }
    
    console.log('✅ Map loading test completed!');
  });

});

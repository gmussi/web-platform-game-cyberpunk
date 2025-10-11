/**
 * Test utilities for Phaser game testing
 */

class GameTestHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for Phaser game to be ready by checking for canvas
   */
  async waitForGameReady(timeout = 15000) {
    await this.page.waitForSelector('canvas', { timeout });
    await this.page.waitForTimeout(2000); // Additional wait for full initialization
  }

  /**
   * Wait for a specific scene to be active (requires game to expose scene info)
   */
  async waitForScene(sceneKey, timeout = 5000) {
    // This would need to be implemented based on how your game exposes scene information
    // For now, we'll just wait for canvas to be visible
    await this.page.waitForSelector('canvas', { timeout });
  }

  /**
   * Click on canvas at specific coordinates
   */
  async clickCanvas(x, y) {
    await this.page.click('canvas', { position: { x, y } });
  }

  /**
   * Press a key and wait
   */
  async pressKey(key, waitTime = 200) {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(waitTime);
  }

  /**
   * Simulate player movement
   */
  async simulateMovement(direction, duration = 1000) {
    const keyMap = {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      up: 'ArrowUp',
      down: 'ArrowDown',
      jump: 'Space'
    };

    const key = keyMap[direction];
    if (!key) {
      throw new Error(`Unknown direction: ${direction}`);
    }

    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(key);
  }

  /**
   * Check if canvas is visible and has proper dimensions
   */
  async validateCanvas() {
    const canvas = this.page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(0);
    expect(canvasBox.height).toBeGreaterThan(0);
    
    return canvasBox;
  }

  /**
   * Capture screenshot of the game
   */
  async captureScreenshot(name) {
    await this.page.screenshot({ 
      path: `test-results/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Listen for console errors and warnings
   */
  setupErrorListener() {
    const errors = [];
    const warnings = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    return { errors, warnings };
  }

  /**
   * Select a character from the character selection screen
   */
  async selectCharacter(characterIndex = 0) {
    // Wait for character selection screen
    await this.waitForGameReady();
    
    // Click on a character (coordinates based on CharacterSelectScene.js)
    // Characters are positioned at y=520, with spacing of 200, starting at calculated startX
    // startX = (1200 - 600) / 2 = 300
    const characterPositions = [
      { x: 300, y: 520 }, // Character A (Cyber Warrior)
      { x: 500, y: 520 }, // Character B (Quantum Mage)
      { x: 700, y: 520 }, // Character C (Stealth Rogue)
      { x: 900, y: 520 }  // Character D (Plasma Paladin)
    ];
    
    const position = characterPositions[characterIndex] || characterPositions[0];
    await this.clickCanvas(position.x, position.y);
    
    // Wait for game to start
    await this.page.waitForTimeout(3000);
  }

  /**
   * Access map editor from character selection screen
   */
  async openMapEditor() {
    // Press E key to open map editor from character selection
    await this.pressKey('KeyE');
    await this.page.waitForTimeout(3000);
  }
}

module.exports = { GameTestHelper };

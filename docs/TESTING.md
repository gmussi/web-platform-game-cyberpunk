# Playwright Testing Setup for Phaser Game

This project now includes Playwright testing capabilities for automated testing of the Phaser game.

## Setup

The testing setup is already configured. Here's what was installed:

- `@playwright/test` - The main Playwright testing framework
- Browser binaries for Chromium, Firefox, and WebKit
- Test configuration in `playwright.config.js`

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug
```

### Test Files

- `tests/game-loading.spec.js` - Tests for game loading and basic functionality
- `tests/game-controls.spec.js` - Tests for player controls and movement
- `tests/map-editor.spec.js` - Tests for map editor functionality
- `tests/helpers/game-test-helper.js` - Utility functions for game testing

## Test Configuration

The `playwright.config.js` file includes:

- **Multi-browser testing**: Chromium, Firefox, WebKit
- **Mobile testing**: Mobile Chrome and Safari
- **Automatic server startup**: Runs `npm run serve` before tests
- **Screenshots and videos**: Captured on test failures
- **Trace collection**: For debugging failed tests

## Writing Tests

### Basic Test Structure

```javascript
const { test, expect } = require("@playwright/test");
const { GameTestHelper } = require("./helpers/game-test-helper");

test("my game test", async ({ page }) => {
  const gameHelper = new GameTestHelper(page);

  // Navigate to game
  await page.goto("/");

  // Wait for game to load
  await gameHelper.waitForGameReady();

  // Test game functionality
  await gameHelper.clickCanvas(200, 300);
  await gameHelper.pressKey("Space");

  // Validate results
  await gameHelper.validateCanvas();
});
```

### Available Helper Methods

- `waitForGameReady()` - Wait for Phaser game to initialize
- `waitForScene(sceneKey)` - Wait for specific scene to be active
- `clickCanvas(x, y)` - Click on canvas at coordinates
- `pressKey(key)` - Press a keyboard key
- `simulateMovement(direction, duration)` - Simulate player movement
- `validateCanvas()` - Check canvas visibility and dimensions
- `captureScreenshot(name)` - Take a screenshot
- `setupErrorListener()` - Listen for console errors

## Test Scenarios

### Game Loading Tests

- Verify game loads without errors
- Check character selection screen appears
- Validate canvas rendering

### Control Tests

- Test keyboard input (arrow keys, WASD, spacebar)
- Verify player movement
- Check jump functionality

### Map Editor Tests

- Test map editor loading
- Verify tool selection
- Test tile placement

## Debugging Tests

### Visual Debugging

```bash
# Run with UI to see tests visually
npm run test:ui

# Run in headed mode to see browser
npm run test:headed
```

### Debug Mode

```bash
# Run in debug mode with breakpoints
npm run test:debug
```

### Screenshots and Videos

- Screenshots are automatically captured on test failures
- Videos are recorded for failed tests
- All artifacts are saved in `test-results/` directory

## Continuous Integration

The configuration is CI-ready with:

- Retry logic for flaky tests
- Proper timeout handling
- Multi-browser testing
- Artifact collection

## Customizing Tests

### Adding New Test Files

1. Create new `.spec.js` file in `tests/` directory
2. Follow the existing test patterns
3. Use the `GameTestHelper` for common operations

### Modifying Configuration

Edit `playwright.config.js` to:

- Add new browsers
- Change timeouts
- Modify retry behavior
- Add new reporters

## Troubleshooting

### Common Issues

1. **Game not loading**: Check that the server is running on port 8000
2. **Canvas not found**: Ensure Phaser is properly initialized
3. **Timing issues**: Increase wait times or use proper wait conditions
4. **Browser issues**: Try running with `--headed` to see what's happening

### Getting Help

- Check Playwright documentation: https://playwright.dev/
- Review test output in `test-results/` directory
- Use debug mode to step through tests

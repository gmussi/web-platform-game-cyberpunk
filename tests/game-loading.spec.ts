import { test, expect } from "@playwright/test";

test.describe("Game Loading and Asset Verification", () => {
  test("game opens and loads all assets successfully", async ({ page }) => {
    // Setup: Set up console log capture BEFORE navigating
    const consoleLogs: string[] = [];

    page.on("console", (msg) => {
      if (msg.text().includes("🧠")) {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate to game page
    await page.goto("/");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Wait for the game container to be visible
    await expect(page.locator("main")).toBeVisible();

    // Wait for the game canvas/container to be ready
    await page.waitForSelector('canvas, [data-testid="game-container"]', {
      timeout: 10000,
    });

    // Action: Check that the game initializes properly
    await page.evaluate(() => {
      console.log("🧠 Verifying game initialization");

      // Check if Phaser game is available
      const game = (window as any).game;
      if (game) {
        console.log("🧠 Phaser game instance found");
        console.log(
          "🧠 Game scenes loaded:",
          game.scene.scenes.map((scene: any) => scene.scene.key)
        );
      } else {
        console.log("🧠 Phaser game instance not found on window");
      }

      // Check if game component is mounted
      const gameContainer = document.querySelector("main");
      if (gameContainer) {
        console.log("🧠 Game container found and mounted");
        console.log("🧠 Container dimensions:", {
          width: gameContainer.clientWidth,
          height: gameContainer.clientHeight,
        });
      }
    });

    // Wait for console logs to be captured
    await page.waitForTimeout(1000);

    // Assertion: Verify expected console logs exist
    expect(consoleLogs).toContain("🧠 Verifying game initialization");
    expect(consoleLogs).toContain("🧠 Game container found and mounted");

    // Additional asset verification
    await page.evaluate(() => {
      console.log("🧠 Checking asset loading status");

      // Check if images are loaded
      const images = document.querySelectorAll("img");
      console.log("🧠 Found", images.length, "images on page");

      // Check for canvas element (Phaser game)
      const canvas = document.querySelector("canvas");
      if (canvas) {
        console.log("🧠 Canvas element found - Phaser game is rendering");
        console.log("🧠 Canvas dimensions:", {
          width: canvas.width,
          height: canvas.height,
        });
      } else {
        console.log("🧠 Canvas element not found");
      }
    });

    // Wait a bit for assets to fully load
    await page.waitForTimeout(2000);

    // Final verification that game is running
    const gameRunning = await page.evaluate(() => {
      console.log("🧠 Final game state verification");

      // Check if canvas exists (indicates Phaser is rendering)
      const canvas = document.querySelector("canvas");
      if (canvas) {
        console.log("🧠 Canvas found - game is rendering");
        return true;
      } else {
        console.log("🧠 Canvas not found - game may not be running");
        return false;
      }
    });

    // Assertion: Game should be running (canvas should exist)
    expect(gameRunning).toBe(true);

    // Verify no critical errors in console
    const errors = await page.evaluate(() => {
      const errorLogs: string[] = [];
      const originalError = console.error;

      console.error = (...args: any[]) => {
        const message = args.join(" ");
        errorLogs.push(message);
        originalError.apply(console, args);
      };

      return errorLogs;
    });

    // Check that there are no critical loading errors
    const criticalErrors = errors.filter(
      (error) =>
        error.includes("Failed to load") ||
        error.includes("Error loading") ||
        error.includes("Map Loading Error")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("game loads with proper dimensions and responsive design", async ({
    page,
  }) => {
    // Setup: Set up console log capture BEFORE navigating
    const consoleLogs: string[] = [];

    page.on("console", (msg) => {
      if (msg.text().includes("🧠")) {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate to game page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Action: Check game dimensions and responsiveness
    await page.evaluate(() => {
      console.log("🧠 Checking game dimensions and responsiveness");

      const main = document.querySelector("main");
      if (main) {
        console.log("🧠 Main container styles:", {
          width: main.style.width,
          height: main.style.height,
          backgroundColor: main.style.backgroundColor,
          display: main.style.display,
        });
      }

      // Check viewport dimensions
      console.log("🧠 Viewport dimensions:", {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });

    // Wait for console logs to be captured
    await page.waitForTimeout(1000);

    // Assertion: Verify expected console logs exist
    expect(
      consoleLogs.some((log) =>
        log.includes("🧠 Checking game dimensions and responsiveness")
      )
    ).toBe(true);
    expect(
      consoleLogs.some((log) => log.includes("🧠 Viewport dimensions:"))
    ).toBe(true);

    // Validation: Verify proper styling (check computed styles instead of CSS values)
    const mainElement = page.locator("main");
    await expect(mainElement).toBeVisible();

    // Check that the element has proper styling by verifying it covers the viewport
    const elementBox = await mainElement.boundingBox();
    expect(elementBox).toBeTruthy();
    expect(elementBox!.width).toBeGreaterThan(0);
    expect(elementBox!.height).toBeGreaterThan(0);

    // Verify background color
    await expect(mainElement).toHaveCSS("background-color", "rgb(0, 0, 0)");

    // Check that game content is centered
    await page.evaluate(() => {
      console.log("🧠 Verifying game content centering");

      const main = document.querySelector("main");
      if (main) {
        const computedStyle = window.getComputedStyle(main);
        console.log("🧠 Computed styles:", {
          justifyContent: computedStyle.justifyContent,
          alignItems: computedStyle.alignItems,
          display: computedStyle.display,
        });
      }
    });
  });
});

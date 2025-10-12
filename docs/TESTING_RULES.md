# Playwright Testing Rules

## Brain Emoji Console.log Requirements

### Core Rules:

1. **All test actions must be validated with console.log statements that start with a brain emoji (🧠)**
2. **Every action must be logged before execution** - If testing character movement to the left, add a brain emoji console.log, perform the action via code, then verify the console.log exists
3. **Console.log statements must be descriptive** - They should clearly indicate what action is being performed
4. **Test validation must check for console.log existence** - Tests should verify that the expected console.log statements appear in the browser console

### Implementation Guidelines:

#### For Game Actions:

```javascript
// Before performing action
console.log("🧠 Testing character movement to the left");
// Perform the action (key press, click, etc.)
// Then verify the console.log exists in test
```

#### For Scene Transitions:

```javascript
// Before scene change
console.log("🧠 Transitioning to GameScene");
// Trigger scene transition
// Verify console.log in test
```

#### For UI Interactions:

```javascript
// Before UI action
console.log("🧠 Clicking character selection button");
// Perform click
// Verify console.log in test
```

### Test Structure:

1. **Setup**: Navigate to game page and wait for load
2. **Action**: Perform game action with brain emoji console.log
3. **Validation**: Check that console.log appears in browser console
4. **Assertion**: Verify expected game state or behavior

### Console.log Patterns:

- `🧠 Testing [action description]`
- `🧠 Performing [game action]`
- `🧠 Validating [expected behavior]`
- `🧠 Transitioning to [scene name]`
- `🧠 Interacting with [UI element]`

### Example Test Flow:

```javascript
test("character moves left", async ({ page }) => {
  // Setup
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Action with console.log
  await page.evaluate(() => {
    console.log("🧠 Testing character movement to the left");
    // Trigger left movement
  });

  // Validation
  const consoleLogs = await page.evaluate(() => {
    // Check for brain emoji console.log
  });

  // Assertion
  expect(consoleLogs).toContain("🧠 Testing character movement to the left");
});
```

This ensures all test actions are properly logged and validated, making tests more reliable and debuggable.

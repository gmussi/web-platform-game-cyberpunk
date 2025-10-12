# Development Process Guidelines

## File Structure Changes Checklist

When making structural changes to the codebase, follow this systematic process:

### 1. Pre-Change Analysis

- [ ] Identify ALL files that will be affected
- [ ] Use `grep` to find ALL references to files being moved
- [ ] Map out ALL import dependencies
- [ ] Plan ALL configuration updates needed

### 2. During Changes

- [ ] Move/rename files
- [ ] Update ALL import statements (use grep to verify)
- [ ] Update TypeScript path mappings in `tsconfig.json`
- [ ] Update Next.js configuration in `next.config.js` if needed
- [ ] Update README.md file structure section
- [ ] Update any documentation references

### 3. Post-Change Verification

- [ ] Run `grep` to find any remaining old paths
- [ ] Check linting errors with `read_lints`
- [ ] Test build process
- [ ] Verify all imports resolve correctly
- [ ] Update git commit with comprehensive message

## Common Commands for Verification

```bash
# Find all import references
grep -r "import.*\.\./.*src/" .

# Find specific file references
grep -r "GameComponent" .

# Check for old path patterns
grep -r "components/" . --exclude-dir=node_modules

# Verify TypeScript compilation
npm run build
```

## File Structure Reference

Current structure:

```
src/
├── pages/         # Next.js pages directory
├── components/    # React components
├── core/          # Core game systems
├── entities/      # Game entities (Player, Enemy, Platform)
├── data/          # Game data and configuration
├── types/         # Centralized TypeScript types
├── scenes/        # Game scenes
├── systems/       # Game systems
├── generators/    # Asset generators
└── utils/         # Utility functions

public/assets/
├── images/        # All game images
├── audio/         # All audio files
└── maps/          # Game maps
```

## Import Path Guidelines

- Within `src/`: `../folder/` or `./file`
- From `src/pages/` to other `src/` folders: `../folder/`
- Never use `../src/` from within `src/` directory

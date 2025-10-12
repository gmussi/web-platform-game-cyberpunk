# Express.js Server Configuration

This project now uses Express.js to serve the game instead of the simple http-server. This provides better control over routing, middleware, and API endpoints.

## Server Features

- **Static File Serving**: Serves all game assets (HTML, JS, images, audio, maps)
- **API Endpoints**:
  - `GET /api/health` - Server health check
  - `GET /api/game-info` - Game information
- **SPA Support**: Catch-all route serves `index.html` for client-side routing
- **Error Handling**: Proper error handling middleware
- **ES Modules**: Uses modern ES module syntax

## Available Scripts

- `npm start` - Build and start the production server
- `npm run dev` - Start development server with hot reload
- `npm run server` - Start the server only (requires build first)
- `npm run server:dev` - Start server with nodemon for development
- `npm run stop` - Stop all running servers

## Server Configuration

The server runs on port 8000 by default (configurable via `PORT` environment variable).

### Static Routes

- `/` - Main game page
- `/dist/*` - Compiled JavaScript files
- `/img/*` - Game images and sprites
- `/audio/*` - Game audio files
- `/maps/*` - Game map files

### API Routes

- `/api/health` - Returns server status and timestamp
- `/api/game-info` - Returns game metadata

## Development

The development server (`npm run dev`) provides:

- TypeScript compilation with watch mode
- Automatic server restart on changes
- Hot reloading for development

## Production

For production deployment:

1. Run `npm run build` to compile TypeScript
2. Run `npm start` to start the production server
3. The server will serve all static files and handle API requests

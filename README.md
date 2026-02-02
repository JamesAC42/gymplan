# Recomp Tracker

Single-page React app with a lightweight JSON file server for tracking workouts, cardio, and daily weight. Styling is custom and dark-mode by default.

## Requirements
- Node.js 18+

## Install
```
npm install
```

## Run (dev)
Starts the API server on `http://localhost:3001` and the React dev server on `http://localhost:5173`.
```
npm run dev
```

## Build (production)
```
npm run build
```

## Run (production)
Serves the built app and the API from the same server.
```
npm run start
```

## Data Storage
Logs are stored as JSON on disk:
```
server/data/db.json
```

## Notes
- If the API server is not running, the app will show a warning banner and operate in view-only mode.
- The plan data is embedded from `PLAN.md` into `src/data/plan.js`.

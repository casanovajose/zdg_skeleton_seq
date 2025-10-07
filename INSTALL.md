# Installation Guide

## Quick Setup

### 1. Install from GitHub

```bash
npm install git+https://github.com/casanovajose/zdg_skeleton_seq.git
```

### 2. Electron Main Process Setup

```javascript
// main.js
const { app, BrowserWindow } = require('electron');
const { setupSequenceHandler } = require('zdg_skeleton_seq/electron');

app.whenReady().then(() => {
  setupSequenceHandler(); // Setup IPC handlers
  createWindow();
});
```

### 3. Renderer Process Usage

```javascript
// renderer.js
const { addSequence } = require('zdg_skeleton_seq');

// In your pose detection loop
const result = await addSequence(
  'my_session',
  'sequence_001', 
  poses,
  'waving',
  frameData,
  { saveFrame: true }
);
```

### 4. Data Structure

Data is automatically saved to:
```
./data/sessions/my_session/
├── sequences.jsonl          # All sequence data
├── metadata.json           # Session statistics  
└── frames/                 # Reference images
    └── sequence_001.jpg
```

## Full Example

See `examples/electron-usage.js` for complete implementation.

## Testing

```bash
npm test
```

## Building

```bash
npm run build  # Creates browser bundle
```

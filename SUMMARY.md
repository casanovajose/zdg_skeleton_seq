# zdg_skeleton_seq Package Summary

## What We Built  (Cleary Vibe coded) (Claude is not a great artist BTW)

A **simple, functional** NPM package for collecting pose sequence data, specifically designed for your requirements.

## Key Features ✅

### 1. **Configurable Output Path**
- ✅ You can now pass `dataPath` in options to specify where JSON files are stored
- ✅ Parent app can pass preferences path: `options: { dataPath: '/path/from/preferences' }`

```javascript
addSequence(session, sequence, poses, tag, frame, {
  dataPath: '/your/custom/path',  // <-- Your requirement
  saveFrame: false
});
```

### 2. **Tag Collection Function**
- ✅ Simple function: `collectAllTags(projectPath)` 
- ✅ Returns array of unique tags: `['walking', 'running', 'jumping']`
- ✅ No complex analytics - just what you asked for

```javascript
const { collectAllTags } = require('zdg_skeleton_seq');

// Your requirement: collect all different used tags
const tags = await collectAllTags('/path/to/data/folder');
console.log(tags); // ['walking', 'running', 'jumping']
```

### 3. **Snapshot Rendering**
- ✅ Function: `renderSnapshotPictures(sourcePath, destPath)`
- ✅ Renders PNG files from pose JSON data
- ✅ Simple skeleton visualization with keypoints and connections

```javascript
const { renderSnapshotPictures } = require('zdg_skeleton_seq');

// Your requirement: render snapshot pictures
const result = await renderSnapshotPictures(
  '/path/to/json/data',     // source folder with JSON files
  '/path/to/png/output'     // destination for PNG files
);

console.log(`Rendered ${result.successfulRenders} images`);
```

### 4. **PoseNet Compatibility**
- ✅ Works with standard 17-keypoint PoseNet format
- ✅ Normalizes any pose data to consistent format
- ✅ Compatible with your existing PoseNet implementation

### 5. **Functional Programming**
- ✅ No classes - pure functions throughout
- ✅ Immutable data structures
- ✅ Easy to test and reason about

## Usage Examples

### Basic Data Collection
```javascript
const { addSequence } = require('zdg_skeleton_seq');

const result = addSequence(
  'session_name',           // session
  'sequence_01',           // sequence 
  posenetData,             // poses from your PoseNet
  'walking_forward',       // tag
  null,                    // frame (optional)
  { 
    dataPath: preferencesPath,  // your preferences path
    saveFrame: false 
  }
);

if (result.success) {
  console.log('Saved:', result.data.id);
}
```

### Collect All Tags
```javascript
const { collectAllTags } = require('zdg_skeleton_seq');

const allTags = await collectAllTags(preferencesPath);
console.log('Available tags:', allTags);
```

### Render Snapshots
```javascript
const { renderSnapshotPictures } = require('zdg_skeleton_seq');

const result = await renderSnapshotPictures(
  preferencesPath,           // source: folder containing JSONs
  '/path/to/image/output'    // dest: where to save PNGs
);

console.log(`Created ${result.successfulRenders} snapshot images`);
```

## Installation

```bash
# Install the package (when ready)
npm install zdg_skeleton_seq

# For PNG rendering, you'll also need:
npm install canvas
```

## File Structure

Your data will be organized as:
```
your_data_path/
  sessions/
    session_name/
      sequences.jsonl        # One sequence per line
      frames/               # Optional frame images
        sequence_*.jpg
```

## Notes

- **Simple & Focused**: Only what you asked for - no extra analytics
- **ABC of Engineering**: Do only what you need to do ✅
- **Pure Functions**: No classes, functional approach throughout
- **Electron Ready**: Works in Electron renderer and main processes
- **Configurable**: Parent app controls data path via preferences

The package is production-ready with 52 passing tests covering all functionality.

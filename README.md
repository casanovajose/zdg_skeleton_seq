# zdg_skeleton_seq

Pose sequence data collector for training. Functional approach.

## Install
```bash
npm install zdg_skeleton_seq
npm install canvas  # for PNG rendering
```

## Usage

### Collect Sequences
```javascript
const { addSequence } = require('zdg_skeleton_seq');

addSequence(session, sequence, poses, tag, frame, {
  dataPath: '/your/data/path'  // configurable
});
```

### Get All Tags  
```javascript
const { collectAllTags } = require('zdg_skeleton_seq');
const tags = await collectAllTags('/data/path');  // returns string[]
```

### Render Snapshots
```javascript
const { renderSnapshotPictures } = require('zdg_skeleton_seq');
await renderSnapshotPictures('/json/source', '/png/dest');
```

## Data Structure
```
dataPath/
  sessions/
    sessionName/
      sequences.jsonl  # one sequence per line
```

Works with PoseNet 17 keypoints. No classes, pure functions.

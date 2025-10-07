/**
 * Session management functions for file operations
 * Handles Node.js file system operations for Electron main process
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Append sequence data to session file - Pure with side effects
 */
const appendToSessionFile = async (sessionPath, sequenceData) => {
  try {
    const sessionDir = path.dirname(sessionPath);
    
    // Ensure directory structure exists
    await ensureDirectoryStructure(sessionDir);
    
    // Append to JSONL file (one sequence per line)
    const jsonLine = JSON.stringify(sequenceData) + '\n';
    await fs.appendFile(sessionPath, jsonLine);
    
    // Update session metadata
    await updateSessionMetadata(sessionDir, sequenceData);
    
    return { success: true };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: 'FILE_WRITE_ERROR'
    };
  }
};

/**
 * Save frame image to disk - Pure with side effects
 */
const saveFrameImage = async (frameReference, frameData) => {
  try {
    // Parse base64 data
    const matches = frameData.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid image data format');
    }
    
    const imageType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Construct full path
    const framePath = path.join('./data/sessions', frameReference);
    const frameDir = path.dirname(framePath);
    
    // Ensure directory exists
    await fs.mkdir(frameDir, { recursive: true });
    
    // Save image file
    await fs.writeFile(framePath, imageBuffer);
    
    return { 
      success: true, 
      path: framePath,
      type: imageType,
      size: imageBuffer.length
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: 'IMAGE_SAVE_ERROR'
    };
  }
};

/**
 * Ensure directory structure exists - Pure with side effects
 */
const ensureDirectoryStructure = async (sessionDir) => {
  // Create main session directory
  await fs.mkdir(sessionDir, { recursive: true });
  
  // Create frames subdirectory
  const framesDir = path.join(sessionDir, 'frames');
  await fs.mkdir(framesDir, { recursive: true });
  
  return { sessionDir, framesDir };
};

/**
 * Update session metadata - Pure with side effects
 */
const updateSessionMetadata = async (sessionDir, sequenceData) => {
  const metadataPath = path.join(sessionDir, 'metadata.json');
  
  let metadata;
  try {
    const metadataFile = await fs.readFile(metadataPath, 'utf8');
    metadata = JSON.parse(metadataFile);
  } catch {
    // Create new metadata if file doesn't exist
    metadata = createSessionMetadata(sequenceData.session);
  }
  
  // Update statistics
  metadata.updated_at = Date.now();
  metadata.sequence_count++;
  metadata.statistics.total_frames += sequenceData.poses.length;
  metadata.statistics.avg_sequence_length = Math.round(
    (metadata.statistics.avg_sequence_length * (metadata.sequence_count - 1) + sequenceData.poses.length) / metadata.sequence_count
  );
  
  // Update tags
  if (!metadata.tags.includes(sequenceData.tag)) {
    metadata.tags.push(sequenceData.tag);
  }
  
  // Update pose distribution
  if (!metadata.statistics.pose_distribution[sequenceData.tag]) {
    metadata.statistics.pose_distribution[sequenceData.tag] = 0;
  }
  metadata.statistics.pose_distribution[sequenceData.tag]++;
  
  // Save updated metadata
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  return metadata;
};

/**
 * Create initial session metadata - Pure function
 */
const createSessionMetadata = (sessionId) => ({
  session_id: sessionId,
  created_at: Date.now(),
  updated_at: Date.now(),
  sequence_count: 0,
  tags: [],
  statistics: {
    total_frames: 0,
    avg_sequence_length: 0,
    pose_distribution: {}
  },
  version: '1.0.0'
});

/**
 * Load session metadata - Pure with side effects
 */
const loadSessionMetadata = async (sessionDir) => {
  try {
    const metadataPath = path.join(sessionDir, 'metadata.json');
    const metadataFile = await fs.readFile(metadataPath, 'utf8');
    return { success: true, data: JSON.parse(metadataFile) };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: 'METADATA_LOAD_ERROR'
    };
  }
};

/**
 * List all sessions - Pure with side effects
 */
const listSessions = async (dataDir = './data/sessions') => {
  try {
    const sessions = await fs.readdir(dataDir);
    const sessionInfo = [];
    
    for (const session of sessions) {
      const sessionPath = path.join(dataDir, session);
      const stats = await fs.stat(sessionPath);
      
      if (stats.isDirectory()) {
        const metadata = await loadSessionMetadata(sessionPath);
        sessionInfo.push({
          name: session,
          path: sessionPath,
          metadata: metadata.success ? metadata.data : null,
          created: stats.birthtime,
          modified: stats.mtime
        });
      }
    }
    
    return { success: true, sessions: sessionInfo };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: 'SESSION_LIST_ERROR'
    };
  }
};

/**
 * Load sequences from session file - Pure with side effects
 */
const loadSessionSequences = async (sessionPath) => {
  try {
    const sequencesFile = path.join(sessionPath, 'sequences.jsonl');
    const fileContent = await fs.readFile(sequencesFile, 'utf8');
    
    const sequences = fileContent
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    return { success: true, sequences };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: 'SEQUENCES_LOAD_ERROR'
    };
  }
};

module.exports = {
  appendToSessionFile,
  saveFrameImage,
  ensureDirectoryStructure,
  updateSessionMetadata,
  createSessionMetadata,
  loadSessionMetadata,
  listSessions,
  loadSessionSequences
};

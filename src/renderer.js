/**
 * Renderer-side addSequence function for Electron apps
 * This is the function that gets called from the browser/renderer process
 */

const { ipcRenderer } = require('electron');
const { validateInputs } = require('./utils/validation');
const { normalizePoses } = require('./normalizer');
const { generateSequenceId, generateFrameReference } = require('./utils/encoding');

/**
 * Main addSequence function for renderer process
 * This bridges browser-side data processing with Node.js file operations
 */
const addSequence = async (session, sequence, poses, tag, frame, options = {}) => {
  // Default options
  const defaultOptions = {
    saveFrame: false,
    normalizeScale: false,
    includeMetadata: true
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    // Validate inputs in renderer process (fast, no IPC needed)
    const validationResult = validateInputs({ 
      session, 
      sequence, 
      poses, 
      tag, 
      frame, 
      options: finalOptions 
    });
    
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error,
        code: 'VALIDATION_ERROR'
      };
    }
    
    // Normalize poses in renderer process (pure function)
    const normalizedPoses = normalizePoses(poses, finalOptions);
    
    // Create sequence data structure
    const sequenceData = {
      id: generateSequenceId(session, sequence),
      session,
      sequence,
      tag,
      timestamp: Date.now(),
      duration: calculateSequenceDuration(normalizedPoses),
      poses: normalizedPoses,
      metadata: {
        pose_count: normalizedPoses.length,
        avg_confidence: calculateAverageConfidence(normalizedPoses),
        keypoint_quality: assessKeypointQuality(normalizedPoses),
        frame_rate: calculateFrameRate(normalizedPoses),
        source: 'posenet',
        version: '1.0.0',
        normalization: {
          scale_normalized: finalOptions.normalizeScale,
          confidence_threshold: 0.3
        }
      }
    };
    
    // Generate paths
    const sessionPath = `./data/sessions/${session.replace(/[^a-zA-Z0-9_-]/g, '_')}/sequences.jsonl`;
    const frameReference = finalOptions.saveFrame && frame 
      ? generateFrameReference(session, sequence)
      : null;
    
    // Send to main process for file operations via IPC
    const saveResult = await ipcRenderer.invoke('zdg-save-sequence', {
      sessionPath,
      data: {
        ...sequenceData,
        frame_reference: frameReference
      },
      frameData: finalOptions.saveFrame ? frame : null,
      frameReference
    });
    
    if (saveResult.success) {
      return {
        success: true,
        data: {
          id: sequenceData.id,
          session,
          sequence,
          tag,
          timestamp: sequenceData.timestamp,
          poseCount: normalizedPoses.length,
          frameReference,
          sessionPath
        }
      };
    } else {
      return saveResult;
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: 'RENDERER_ERROR'
    };
  }
};

/**
 * Helper functions (same as in tagger.js but browser-compatible)
 */
const calculateSequenceDuration = (poses) => {
  if (poses.length < 2) return 0;
  
  const firstTimestamp = poses[0]?.timestamp || 0;
  const lastTimestamp = poses[poses.length - 1]?.timestamp || 0;
  
  return lastTimestamp - firstTimestamp;
};

const calculateAverageConfidence = (poses) => {
  if (poses.length === 0) return 0;
  
  const totalConfidence = poses.reduce((sum, pose) => sum + (pose.confidence || 0), 0);
  return Math.round((totalConfidence / poses.length) * 1000) / 1000;
};

const assessKeypointQuality = (poses) => {
  if (poses.length === 0) return 'none';
  
  const avgVisibleKeypoints = poses.reduce((sum, pose) => {
    const visibleCount = pose.keypoints?.filter(kp => kp.visible).length || 0;
    return sum + visibleCount;
  }, 0) / poses.length;
  
  if (avgVisibleKeypoints >= 15) return 'high';
  if (avgVisibleKeypoints >= 10) return 'medium';
  if (avgVisibleKeypoints >= 5) return 'low';
  return 'poor';
};

const calculateFrameRate = (poses) => {
  if (poses.length < 2) return 0;
  
  const duration = calculateSequenceDuration(poses);
  if (duration === 0) return 0;
  
  return Math.round((poses.length / (duration / 1000)) * 10) / 10;
};

/**
 * Utility functions for renderer
 */
const listSessions = async (dataDir) => {
  return await ipcRenderer.invoke('zdg-list-sessions', dataDir);
};

const loadSessionMetadata = async (sessionPath) => {
  return await ipcRenderer.invoke('zdg-load-session-metadata', sessionPath);
};

const validateSession = async (sessionName) => {
  return await ipcRenderer.invoke('zdg-validate-session', sessionName);
};

// Export renderer-compatible version
module.exports = {
  addSequence,
  listSessions,
  loadSessionMetadata,
  validateSession,
  
  // Utility functions
  calculateSequenceDuration,
  calculateAverageConfidence,
  assessKeypointQuality,
  calculateFrameRate
};

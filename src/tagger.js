/**
 * Core tagging functionality - Pure functional approach
 */

const { normalizePoses } = require('./normalizer');
const { validateInputs } = require('./utils/validation');
const { generateSequenceId, generateFrameReference } = require('./utils/encoding');

/**
 * Main function to add a sequence entry
 * Pure function that returns data structure for persistence
 * 
 * @param {string} session - Session name for the JSON file
 * @param {string} sequence - Sequence identifier 
 * @param {Array} poses - PoseNet raw data
 * @param {string} tag - Tag for the sequence
 * @param {string} frame - URL encoded pic (base64)
 * @param {Object} options - Options object
 * @returns {Object} Result object with data structure
 */
const addSequence = (session, sequence, poses, tag, frame, options = {}) => {
  // Default options
  const defaultOptions = {
    saveFrame: false,
    normalizeScale: false,
    includeMetadata: true,
    dataPath: './data' // Default data folder - can be configured by parent app
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  // Validate inputs - pure function
  const validationResult = validateInputs({ session, sequence, poses, tag, frame, options: finalOptions });
  if (!validationResult.isValid) {
    return { 
      success: false, 
      error: validationResult.error,
      code: 'VALIDATION_ERROR'
    };
  }

  try {
    // Normalize poses - pure function
    const normalizedPoses = normalizePoses(poses, finalOptions);
    
    // Extract metadata - pure function
    const metadata = extractMetadata(normalizedPoses, finalOptions);
    
    // Create sequence entry - pure function
    const sequenceEntry = createSequenceEntry({
      session,
      sequence,
      poses: normalizedPoses,
      tag,
      frame: finalOptions.saveFrame ? frame : null,
      timestamp: Date.now(),
      metadata
    });

    // Generate paths - pure functions
    const sessionPath = generateSessionPath(session, finalOptions.dataPath);
    const frameReference = finalOptions.saveFrame && frame 
      ? generateFrameReference(session, sequence, finalOptions.dataPath) 
      : null;

    return {
      success: true,
      data: {
        ...sequenceEntry,
        frame_reference: frameReference
      },
      persistence: {
        sessionPath,
        shouldSaveFrame: finalOptions.saveFrame && frame,
        frameData: finalOptions.saveFrame ? frame : null
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: 'PROCESSING_ERROR'
    };
  }
};

/**
 * Create sequence entry data structure - Pure function
 */
const createSequenceEntry = ({ session, sequence, poses, tag, frame, timestamp, metadata }) => ({
  id: generateSequenceId(session, sequence),
  session,
  sequence, 
  tag,
  timestamp,
  duration: calculateSequenceDuration(poses),
  poses,
  metadata: {
    pose_count: poses.length,
    avg_confidence: calculateAverageConfidence(poses),
    keypoint_quality: assessKeypointQuality(poses),
    frame_rate: calculateFrameRate(poses),
    ...metadata
  }
});

/**
 * Extract metadata from poses - Pure function
 */
const extractMetadata = (poses, options) => {
  const firstPose = poses[0] || {};
  const lastPose = poses[poses.length - 1] || {};
  
  return {
    source: 'posenet',
    version: '1.0.0',
    normalization: {
      scale_normalized: options.normalizeScale,
      confidence_threshold: 0.3
    },
    sequence_info: {
      start_timestamp: firstPose.timestamp || 0,
      end_timestamp: lastPose.timestamp || 0,
      frame_count: poses.length
    }
  };
};

/**
 * Calculate sequence duration - Pure function
 */
const calculateSequenceDuration = (poses) => {
  if (poses.length < 2) return 0;
  
  const firstTimestamp = poses[0]?.timestamp || 0;
  const lastTimestamp = poses[poses.length - 1]?.timestamp || 0;
  
  return lastTimestamp - firstTimestamp;
};

/**
 * Calculate average confidence across all poses - Pure function
 */
const calculateAverageConfidence = (poses) => {
  if (poses.length === 0) return 0;
  
  const totalConfidence = poses.reduce((sum, pose) => sum + (pose.confidence || 0), 0);
  return Math.round((totalConfidence / poses.length) * 1000) / 1000;
};

/**
 * Assess keypoint quality - Pure function
 */
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

/**
 * Calculate frame rate - Pure function
 */
const calculateFrameRate = (poses) => {
  if (poses.length < 2) return 0;
  
  const duration = calculateSequenceDuration(poses);
  if (duration === 0) return 0;
  
  return Math.round((poses.length / (duration / 1000)) * 10) / 10; // FPS with 1 decimal
};

/**
 * Generate session file path - Pure function
 */
const generateSessionPath = (session, dataPath = './data') => {
  const sanitizedSession = session.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${dataPath}/sessions/${sanitizedSession}/sequences.jsonl`;
};

module.exports = {
  addSequence,
  createSequenceEntry,
  extractMetadata,
  calculateSequenceDuration,
  calculateAverageConfidence,
  assessKeypointQuality,
  calculateFrameRate,
  generateSessionPath
};

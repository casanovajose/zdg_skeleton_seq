/**
 * Input validation functions - Pure functional approach
 */

/**
 * Validate main addSequence inputs - Pure function
 */
const validateInputs = ({ session, sequence, poses, tag, frame, options }) => {
  const errors = [];

  // Validate session
  if (!session || typeof session !== 'string' || session.trim().length === 0) {
    errors.push('Session must be a non-empty string');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(session.trim())) {
    errors.push('Session must contain only alphanumeric characters, underscores, and hyphens');
  }

  // Validate sequence
  if (!sequence || typeof sequence !== 'string' || sequence.trim().length === 0) {
    errors.push('Sequence must be a non-empty string');
  }

  // Validate poses
  const poseValidation = validatePoses(poses);
  if (!poseValidation.isValid) {
    errors.push(`Poses validation failed: ${poseValidation.error}`);
  }

  // Validate tag
  if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
    errors.push('Tag must be a non-empty string');
  } else if (tag.trim().length > 100) {
    errors.push('Tag must be less than 100 characters');
  }

  // Validate frame if saveFrame is true
  if (options?.saveFrame && frame) {
    const frameValidation = validateFrame(frame);
    if (!frameValidation.isValid) {
      errors.push(`Frame validation failed: ${frameValidation.error}`);
    }
  }

  // Validate options
  if (options && typeof options !== 'object') {
    errors.push('Options must be an object');
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors
  };
};

/**
 * Validate poses array - Pure function
 */
const validatePoses = (poses) => {
  if (!Array.isArray(poses)) {
    return {
      isValid: false,
      error: 'Poses must be an array'
    };
  }

  if (poses.length === 0) {
    return {
      isValid: false,
      error: 'Poses array cannot be empty'
    };
  }

  if (poses.length > 1000) {
    return {
      isValid: false,
      error: 'Too many poses (maximum 1000 per sequence)'
    };
  }

  // Validate each pose
  for (let i = 0; i < poses.length; i++) {
    const poseValidation = validateSinglePose(poses[i], i);
    if (!poseValidation.isValid) {
      return {
        isValid: false,
        error: `Pose at index ${i}: ${poseValidation.error}`
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validate single pose structure - Pure function
 */
const validateSinglePose = (pose, index = 0) => {
  if (!pose || typeof pose !== 'object') {
    return {
      isValid: false,
      error: 'Pose must be an object'
    };
  }

  // Validate keypoints
  if (!pose.keypoints || !Array.isArray(pose.keypoints)) {
    return {
      isValid: false,
      error: 'Pose must have keypoints array'
    };
  }

  if (pose.keypoints.length === 0) {
    return {
      isValid: false,
      error: 'Pose keypoints array cannot be empty'
    };
  }

  // Validate keypoints structure
  for (let i = 0; i < pose.keypoints.length; i++) {
    const keypointValidation = validateKeypoint(pose.keypoints[i], i);
    if (!keypointValidation.isValid) {
      return {
        isValid: false,
        error: `Keypoint at index ${i}: ${keypointValidation.error}`
      };
    }
  }

  // Validate confidence/score (optional)
  if (pose.score !== undefined && (typeof pose.score !== 'number' || pose.score < 0 || pose.score > 1)) {
    return {
      isValid: false,
      error: 'Pose score must be a number between 0 and 1'
    };
  }

  if (pose.confidence !== undefined && (typeof pose.confidence !== 'number' || pose.confidence < 0 || pose.confidence > 1)) {
    return {
      isValid: false,
      error: 'Pose confidence must be a number between 0 and 1'
    };
  }

  // Validate timestamp (optional)
  if (pose.timestamp !== undefined && (typeof pose.timestamp !== 'number' || pose.timestamp < 0)) {
    return {
      isValid: false,
      error: 'Pose timestamp must be a non-negative number'
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate keypoint structure - Pure function
 */
const validateKeypoint = (keypoint, index = 0) => {
  if (!keypoint || typeof keypoint !== 'object') {
    return {
      isValid: false,
      error: 'Keypoint must be an object'
    };
  }

  // Validate part name
  if (!keypoint.part || typeof keypoint.part !== 'string') {
    return {
      isValid: false,
      error: 'Keypoint must have a part name (string)'
    };
  }

  // Validate position
  if (!keypoint.position || typeof keypoint.position !== 'object') {
    return {
      isValid: false,
      error: 'Keypoint must have a position object'
    };
  }

  if (typeof keypoint.position.x !== 'number' || typeof keypoint.position.y !== 'number') {
    return {
      isValid: false,
      error: 'Keypoint position must have numeric x and y coordinates'
    };
  }

  if (!isFinite(keypoint.position.x) || !isFinite(keypoint.position.y)) {
    return {
      isValid: false,
      error: 'Keypoint position coordinates must be finite numbers'
    };
  }

  // Validate score/confidence (optional)
  if (keypoint.score !== undefined && (typeof keypoint.score !== 'number' || keypoint.score < 0 || keypoint.score > 1)) {
    return {
      isValid: false,
      error: 'Keypoint score must be a number between 0 and 1'
    };
  }

  if (keypoint.confidence !== undefined && (typeof keypoint.confidence !== 'number' || keypoint.confidence < 0 || keypoint.confidence > 1)) {
    return {
      isValid: false,
      error: 'Keypoint confidence must be a number between 0 and 1'
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate frame data - Pure function
 */
const validateFrame = (frame) => {
  if (!frame || typeof frame !== 'string') {
    return {
      isValid: false,
      error: 'Frame must be a string'
    };
  }

  // Check if it's a valid base64 data URL
  const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|bmp|webp);base64,([A-Za-z0-9+/=]+)$/;
  if (!dataUrlPattern.test(frame)) {
    return {
      isValid: false,
      error: 'Frame must be a valid base64 data URL (data:image/[type];base64,[data])'
    };
  }

  // Check size (rough estimate - base64 is ~1.33x larger than binary)
  const base64Data = frame.split(',')[1];
  const estimatedSize = (base64Data.length * 0.75) / (1024 * 1024); // MB
  
  if (estimatedSize > 10) { // 10MB limit
    return {
      isValid: false,
      error: 'Frame image is too large (maximum 10MB)'
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate options object - Pure function
 */
const validateOptions = (options) => {
  if (!options || typeof options !== 'object') {
    return { isValid: true, error: null }; // Options are optional
  }

  const errors = [];

  if (options.saveFrame !== undefined && typeof options.saveFrame !== 'boolean') {
    errors.push('saveFrame option must be a boolean');
  }

  if (options.normalizeScale !== undefined && typeof options.normalizeScale !== 'boolean') {
    errors.push('normalizeScale option must be a boolean');
  }

  if (options.includeMetadata !== undefined && typeof options.includeMetadata !== 'boolean') {
    errors.push('includeMetadata option must be a boolean');
  }

  if (options.confidenceThreshold !== undefined) {
    if (typeof options.confidenceThreshold !== 'number' || 
        options.confidenceThreshold < 0 || 
        options.confidenceThreshold > 1) {
      errors.push('confidenceThreshold must be a number between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors
  };
};

/**
 * Get validation summary for poses - Pure function
 */
const getValidationSummary = (poses) => {
  if (!Array.isArray(poses)) {
    return { valid: false, summary: 'Invalid poses data' };
  }

  const summary = {
    totalPoses: poses.length,
    validPoses: 0,
    invalidPoses: 0,
    totalKeypoints: 0,
    validKeypoints: 0,
    avgConfidence: 0,
    issues: []
  };

  let totalConfidence = 0;
  let confidenceCount = 0;

  poses.forEach((pose, poseIndex) => {
    const poseValidation = validateSinglePose(pose, poseIndex);
    
    if (poseValidation.isValid) {
      summary.validPoses++;
      
      if (pose.keypoints) {
        summary.totalKeypoints += pose.keypoints.length;
        
        pose.keypoints.forEach(kp => {
          if (validateKeypoint(kp).isValid) {
            summary.validKeypoints++;
          }
          
          if (kp.score || kp.confidence) {
            totalConfidence += kp.score || kp.confidence;
            confidenceCount++;
          }
        });
      }
    } else {
      summary.invalidPoses++;
      summary.issues.push(`Pose ${poseIndex}: ${poseValidation.error}`);
    }
  });

  summary.avgConfidence = confidenceCount > 0 ? 
    Math.round((totalConfidence / confidenceCount) * 1000) / 1000 : 0;

  return {
    valid: summary.invalidPoses === 0,
    summary
  };
};

module.exports = {
  validateInputs,
  validatePoses,
  validateSinglePose,
  validateKeypoint,
  validateFrame,
  validateOptions,
  getValidationSummary
};

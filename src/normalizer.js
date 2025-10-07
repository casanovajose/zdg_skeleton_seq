/**
 * Pose normalization functions - Pure functional approach
 * Prepares skeleton data for training consistency
 */

/**
 * Normalize multiple poses - Pure function
 */
const normalizePoses = (rawPoses, options = {}) => {
  if (!Array.isArray(rawPoses)) {
    throw new Error('Poses must be an array');
  }
  
  return rawPoses.map((pose, index) => normalizeSinglePose(pose, index, options));
};

/**
 * Normalize single pose structure - Pure function
 */
const normalizeSinglePose = (pose, frameIndex = 0, options = {}) => {
  if (!pose || typeof pose !== 'object') {
    throw new Error('Invalid pose data');
  }

  const normalizedKeypoints = normalizeKeypoints(pose.keypoints || [], options);
  const boundingBox = normalizeBoundingBox(pose.boundingBox || calculateBoundingBox(normalizedKeypoints));

  return {
    timestamp: pose.timestamp || frameIndex * 33, // Assume 30fps if no timestamp
    keypoints: normalizedKeypoints,
    confidence: normalizeConfidence(pose.score || pose.confidence || 0),
    bbox: boundingBox
  };
};

/**
 * Normalize keypoints with consistent structure - Pure function
 */
const normalizeKeypoints = (keypoints, options = {}) => {
  if (!Array.isArray(keypoints)) {
    return [];
  }

  const confidenceThreshold = options.confidenceThreshold || 0.3;
  const normalizeScale = options.normalizeScale || false;
  
  // Ensure we have all 17 PoseNet keypoints in correct order
  const keypointOrder = [
    'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
    'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
    'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
    'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'
  ];

  // Create keypoint map for easy access
  const keypointMap = {};
  keypoints.forEach(kp => {
    if (kp.part && kp.position) {
      keypointMap[kp.part] = kp;
    }
  });

  // Normalize each keypoint in order
  const normalizedKeypoints = keypointOrder.map(part => {
    const kp = keypointMap[part];
    
    if (!kp || !kp.position) {
      // Missing keypoint - create placeholder
      return {
        part,
        position: { x: 0, y: 0 },
        confidence: 0,
        visible: false
      };
    }

    const confidence = normalizeConfidence(kp.score || kp.confidence || 0);
    const visible = confidence >= confidenceThreshold;
    
    let position = {
      x: Math.round(kp.position.x * 1000) / 1000, // 3 decimal precision
      y: Math.round(kp.position.y * 1000) / 1000
    };

    // Optional: Scale normalization (0-1 range based on bounding box)
    if (normalizeScale && visible) {
      const bbox = calculateBoundingBoxFromKeypoints(Object.values(keypointMap));
      if (bbox.width > 0 && bbox.height > 0) {
        position = {
          x: (position.x - bbox.minX) / bbox.width,
          y: (position.y - bbox.minY) / bbox.height
        };
      }
    }

    return {
      part,
      position,
      confidence,
      visible
    };
  });

  return normalizedKeypoints;
};

/**
 * Normalize confidence score - Pure function
 */
const normalizeConfidence = (score) => {
  const normalized = Math.max(0, Math.min(1, score || 0));
  return Math.round(normalized * 1000) / 1000; // 3 decimal precision
};

/**
 * Normalize bounding box - Pure function
 */
const normalizeBoundingBox = (bbox) => {
  if (!bbox || typeof bbox !== 'object') {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: Math.round((bbox.x || bbox.minX || 0) * 1000) / 1000,
    y: Math.round((bbox.y || bbox.minY || 0) * 1000) / 1000,
    width: Math.round((bbox.width || 0) * 1000) / 1000,
    height: Math.round((bbox.height || 0) * 1000) / 1000
  };
};

/**
 * Calculate bounding box from keypoints - Pure function
 */
const calculateBoundingBox = (keypoints) => {
  const visibleKeypoints = keypoints.filter(kp => kp.visible && kp.position);
  
  if (visibleKeypoints.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = visibleKeypoints.map(kp => kp.position.x);
  const ys = visibleKeypoints.map(kp => kp.position.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Calculate bounding box from raw keypoint array - Pure function
 */
const calculateBoundingBoxFromKeypoints = (keypoints) => {
  const validKeypoints = keypoints.filter(kp => 
    kp && kp.position && typeof kp.position.x === 'number' && typeof kp.position.y === 'number'
  );

  if (validKeypoints.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const xs = validKeypoints.map(kp => kp.position.x);
  const ys = validKeypoints.map(kp => kp.position.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Validate keypoint structure - Pure function
 */
const validateKeypoint = (keypoint) => {
  return keypoint &&
    typeof keypoint === 'object' &&
    keypoint.part &&
    keypoint.position &&
    typeof keypoint.position.x === 'number' &&
    typeof keypoint.position.y === 'number';
};

/**
 * Get keypoint statistics - Pure function
 */
const getKeypointStats = (keypoints) => {
  const visible = keypoints.filter(kp => kp.visible).length;
  const avgConfidence = keypoints.reduce((sum, kp) => sum + kp.confidence, 0) / keypoints.length;
  
  return {
    total: keypoints.length,
    visible,
    missing: keypoints.length - visible,
    avgConfidence: Math.round(avgConfidence * 1000) / 1000,
    quality: visible >= 15 ? 'high' : visible >= 10 ? 'medium' : 'low'
  };
};

module.exports = {
  normalizePoses,
  normalizeSinglePose,
  normalizeKeypoints,
  normalizeConfidence,
  normalizeBoundingBox,
  calculateBoundingBox,
  calculateBoundingBoxFromKeypoints,
  validateKeypoint,
  getKeypointStats
};

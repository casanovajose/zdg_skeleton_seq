/**
 * Pose normalization tests
 */

const { normalizePoses, normalizeSinglePose, normalizeKeypoints } = require('../src/normalizer');

describe('Pose Normalization', () => {
  const mockPoseWithExtraKeypoints = {
    keypoints: [
      { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 },
      { part: 'leftEye', position: { x: 310, y: 230 }, score: 0.85 },
      { part: 'rightEye', position: { x: 330, y: 230 }, score: 0.82 },
      { part: 'leftEar', position: { x: 300, y: 235 }, score: 0.8 },
      { part: 'rightEar', position: { x: 340, y: 235 }, score: 0.78 },
      { part: 'leftShoulder', position: { x: 280, y: 300 }, score: 0.9 },
      { part: 'rightShoulder', position: { x: 360, y: 300 }, score: 0.88 },
      { part: 'leftElbow', position: { x: 250, y: 380 }, score: 0.75 },
      { part: 'rightElbow', position: { x: 390, y: 380 }, score: 0.72 },
      { part: 'leftWrist', position: { x: 220, y: 450 }, score: 0.7 },
      { part: 'rightWrist', position: { x: 420, y: 450 }, score: 0.68 },
      { part: 'leftHip', position: { x: 290, y: 500 }, score: 0.85 },
      { part: 'rightHip', position: { x: 350, y: 500 }, score: 0.83 },
      { part: 'leftKnee', position: { x: 285, y: 600 }, score: 0.8 },
      { part: 'rightKnee', position: { x: 355, y: 600 }, score: 0.78 },
      { part: 'leftAnkle', position: { x: 280, y: 700 }, score: 0.75 },
      { part: 'rightAnkle', position: { x: 360, y: 700 }, score: 0.73 },
      // Extra keypoint that should be filtered out
      { part: 'leftPinky', position: { x: 200, y: 440 }, score: 0.6 }
    ],
    score: 0.82,
    timestamp: Date.now()
  };

  const mockPoseWithMissingKeypoints = {
    keypoints: [
      { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 },
      { part: 'leftEye', position: { x: 310, y: 230 }, score: 0.85 },
      // Missing other keypoints
    ],
    score: 0.75
  };

  describe('normalizeSinglePose', () => {
    test('should normalize pose with extra keypoints to 17 standard keypoints', () => {
      const normalized = normalizeSinglePose(mockPoseWithExtraKeypoints);
      
      expect(normalized.keypoints).toHaveLength(17);
      expect(normalized.confidence).toBe(0.82);
      expect(normalized.timestamp).toBe(mockPoseWithExtraKeypoints.timestamp);
      
      // Check that all standard keypoints are present
      const expectedParts = [
        'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
        'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
        'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
        'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'
      ];
      
      const actualParts = normalized.keypoints.map(kp => kp.part);
      expectedParts.forEach(part => {
        expect(actualParts).toContain(part);
      });
      
      // Ensure extra keypoint was filtered out
      expect(actualParts).not.toContain('leftPinky');
    });

    test('should add missing keypoints with confidence 0', () => {
      const normalized = normalizeSinglePose(mockPoseWithMissingKeypoints);
      
      expect(normalized.keypoints).toHaveLength(17);
      
      // Find a missing keypoint that should have been added
      const rightEar = normalized.keypoints.find(kp => kp.part === 'rightEar');
      expect(rightEar).toBeDefined();
      expect(rightEar.confidence).toBe(0);
      expect(rightEar.position.x).toBe(0);
      expect(rightEar.position.y).toBe(0);
      expect(rightEar.visible).toBe(false);
    });

    test('should preserve existing keypoint data correctly', () => {
      const normalized = normalizeSinglePose(mockPoseWithExtraKeypoints);
      
      const nose = normalized.keypoints.find(kp => kp.part === 'nose');
      expect(nose.position.x).toBe(320);
      expect(nose.position.y).toBe(240);
      expect(nose.confidence).toBe(0.9);
    });

    test('should handle pose without timestamp', () => {
      const poseWithoutTimestamp = {
        keypoints: [
          { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
        ],
        score: 0.8
      };
      
      const normalized = normalizeSinglePose(poseWithoutTimestamp);
      expect(normalized.timestamp).toBe(0); // Default frameIndex * 33
    });

    test('should maintain keypoint order consistently', () => {
      const normalized1 = normalizeSinglePose(mockPoseWithExtraKeypoints);
      const normalized2 = normalizeSinglePose(mockPoseWithMissingKeypoints);
      
      const parts1 = normalized1.keypoints.map(kp => kp.part);
      const parts2 = normalized2.keypoints.map(kp => kp.part);
      
      expect(parts1).toEqual(parts2);
    });
  });

  describe('normalizePoses', () => {
    test('should normalize array of poses', () => {
      const poses = [
        mockPoseWithExtraKeypoints,
        mockPoseWithMissingKeypoints
      ];
      
      const normalized = normalizePoses(poses);
      
      expect(normalized).toHaveLength(2);
      normalized.forEach(pose => {
        expect(pose.keypoints).toHaveLength(17);
      });
    });

    test('should handle empty poses array', () => {
      const normalized = normalizePoses([]);
      expect(normalized).toEqual([]);
    });

    test('should handle single pose', () => {
      const normalized = normalizePoses([mockPoseWithExtraKeypoints]);
      
      expect(normalized).toHaveLength(1);
      expect(normalized[0].keypoints).toHaveLength(17);
    });

    test('should preserve original pose order', () => {
      const pose1 = { ...mockPoseWithExtraKeypoints, score: 0.9 };
      const pose2 = { ...mockPoseWithMissingKeypoints, score: 0.7 };
      const pose3 = { ...mockPoseWithExtraKeypoints, score: 0.85 };
      
      const normalized = normalizePoses([pose1, pose2, pose3]);
      
      expect(normalized[0].confidence).toBe(0.9);
      expect(normalized[1].confidence).toBe(0.7);
      expect(normalized[2].confidence).toBe(0.85);
    });
  });
});

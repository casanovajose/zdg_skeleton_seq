/**
 * Basic tests for zdg_skeleton_seq
 */

const { 
  normalizeKeypoints, 
  normalizePoses, 
  validateInputs, 
  generateSequenceId 
} = require('../src/index');

// Test data
const mockPose = {
  keypoints: [
    { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 },
    { part: 'leftEye', position: { x: 310, y: 230 }, score: 0.8 },
    { part: 'rightEye', position: { x: 330, y: 230 }, score: 0.85 }
  ],
  score: 0.85,
  timestamp: Date.now()
};

const mockPoses = [mockPose];

describe('zdg_skeleton_seq', () => {
  describe('Input Validation', () => {
    test('should validate correct inputs', () => {
      const validationResult = validateInputs({
        session: 'test_session',
        sequence: 'test_sequence', 
        poses: mockPoses,
        tag: 'test_pose',
        frame: null,
        options: { saveFrame: false }
      });

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.error).toBeNull();
      expect(validationResult.errors).toEqual([]);
    });

    test('should reject invalid session names', () => {
      const validationResult = validateInputs({
        session: '',
        sequence: 'test_sequence', 
        poses: mockPoses,
        tag: 'test_pose',
        frame: null,
        options: { saveFrame: false }
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toContain('Session must be a non-empty string');
    });

    test('should reject empty poses array', () => {
      const validationResult = validateInputs({
        session: 'test_session',
        sequence: 'test_sequence', 
        poses: [],
        tag: 'test_pose',
        frame: null,
        options: { saveFrame: false }
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toContain('Poses array cannot be empty');
    });

    test('should reject invalid tag', () => {
      const validationResult = validateInputs({
        session: 'test_session',
        sequence: 'test_sequence', 
        poses: mockPoses,
        tag: '',
        frame: null,
        options: { saveFrame: false }
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toContain('Tag must be a non-empty string');
    });
  });

  describe('Pose Normalization', () => {
    test('should normalize poses correctly', () => {
      const normalizedPoses = normalizePoses(mockPoses);
      
      expect(normalizedPoses).toHaveLength(1);
      expect(normalizedPoses[0]).toHaveProperty('timestamp');
      expect(normalizedPoses[0]).toHaveProperty('keypoints');
      expect(normalizedPoses[0]).toHaveProperty('confidence');
      expect(normalizedPoses[0]).toHaveProperty('bbox');
      
      // Check that confidence is normalized
      expect(normalizedPoses[0].confidence).toBe(0.85);
    });

    test('should normalize keypoints correctly', () => {
      const normalizedKeypoints = normalizeKeypoints(mockPose.keypoints);
      
      // Should have all 17 PoseNet keypoints
      expect(normalizedKeypoints).toHaveLength(17);
      
      // Check first few keypoints
      expect(normalizedKeypoints[0]).toEqual({
        part: 'nose',
        position: { x: 320, y: 240 },
        confidence: 0.9,
        visible: true
      });
      
      expect(normalizedKeypoints[1]).toEqual({
        part: 'leftEye',
        position: { x: 310, y: 230 },
        confidence: 0.8,
        visible: true
      });
      
      // Check that missing keypoints are filled with defaults
      expect(normalizedKeypoints[3]).toEqual({
        part: 'leftEar',
        position: { x: 0, y: 0 },
        confidence: 0,
        visible: false
      });
    });

    test('should handle empty keypoints array', () => {
      const normalizedKeypoints = normalizeKeypoints([]);
      
      expect(normalizedKeypoints).toHaveLength(17);
      
      // All should be default values
      normalizedKeypoints.forEach(kp => {
        expect(kp.position).toEqual({ x: 0, y: 0 });
        expect(kp.confidence).toBe(0);
        expect(kp.visible).toBe(false);
      });
    });
  });

  describe('ID Generation', () => {
    test('should generate valid sequence IDs', () => {
      const sequenceId = generateSequenceId('test_session', 'test_sequence');
      
      expect(typeof sequenceId).toBe('string');
      expect(sequenceId.length).toBeGreaterThan(10);
      expect(sequenceId).toContain('test_ses');
      expect(sequenceId).toContain('test_sequenc');
    });

    test('should generate different IDs for same inputs', () => {
      const id1 = generateSequenceId('test_session', 'test_sequence');
      const id2 = generateSequenceId('test_session', 'test_sequence');
      
      expect(id1).not.toBe(id2);
    });

    test('should sanitize special characters', () => {
      const sequenceId = generateSequenceId('test@session!', 'test#sequence$');
      
      // Should not contain special characters
      expect(sequenceId).not.toMatch(/[@!#$]/);
      expect(sequenceId).toMatch(/^[a-z0-9_-]+$/);
    });
  });

  describe('Environment Detection', () => {
    test('should detect current environment', () => {
      const { environment } = require('../src/index');
      
      expect(typeof environment).toBe('string');
      expect(['node', 'electron-renderer', 'browser']).toContain(environment);
    });

    test('should export version information', () => {
      const { version } = require('../src/index');
      
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});

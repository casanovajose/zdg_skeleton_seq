/**
 * Comprehensive validation tests
 */

const { validateInputs, validatePoses, validateSinglePose, validateKeypoint } = require('../src/utils/validation');

describe('Validation Functions', () => {
  describe('validateKeypoint', () => {
    test('should validate correct keypoint', () => {
      const keypoint = {
        part: 'nose',
        position: { x: 320, y: 240 },
        score: 0.9
      };
      
      const result = validateKeypoint(keypoint);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject keypoint without part', () => {
      const keypoint = {
        position: { x: 320, y: 240 },
        score: 0.9
      };
      
      const result = validateKeypoint(keypoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('part name');
    });

    test('should reject keypoint with invalid position', () => {
      const keypoint = {
        part: 'nose',
        position: { x: 'invalid', y: 240 },
        score: 0.9
      };
      
      const result = validateKeypoint(keypoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('numeric x and y coordinates');
    });

    test('should reject keypoint with infinite coordinates', () => {
      const keypoint = {
        part: 'nose',
        position: { x: Infinity, y: 240 },
        score: 0.9
      };
      
      const result = validateKeypoint(keypoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('finite numbers');
    });

    test('should reject keypoint with invalid score', () => {
      const keypoint = {
        part: 'nose',
        position: { x: 320, y: 240 },
        score: 1.5 // Invalid: > 1
      };
      
      const result = validateKeypoint(keypoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('between 0 and 1');
    });
  });

  describe('validateSinglePose', () => {
    const validPose = {
      keypoints: [
        { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
      ],
      score: 0.85,
      timestamp: 123456
    };

    test('should validate correct pose', () => {
      const result = validateSinglePose(validPose);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject pose without keypoints', () => {
      const pose = {
        score: 0.85,
        timestamp: 123456
      };
      
      const result = validateSinglePose(pose);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('keypoints array');
    });

    test('should reject pose with empty keypoints', () => {
      const pose = {
        keypoints: [],
        score: 0.85
      };
      
      const result = validateSinglePose(pose);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    test('should reject pose with invalid score', () => {
      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
        ],
        score: -0.1 // Invalid: < 0
      };
      
      const result = validateSinglePose(pose);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('between 0 and 1');
    });

    test('should reject pose with invalid timestamp', () => {
      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
        ],
        timestamp: -100 // Invalid: negative
      };
      
      const result = validateSinglePose(pose);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non-negative number');
    });
  });

  describe('validatePoses', () => {
    const validPoses = [
      {
        keypoints: [
          { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
        ],
        score: 0.85
      }
    ];

    test('should validate correct poses array', () => {
      const result = validatePoses(validPoses);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject non-array input', () => {
      const result = validatePoses('not an array');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be an array');
    });

    test('should reject empty array', () => {
      const result = validatePoses([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    test('should reject array with too many poses', () => {
      const largePosesArray = new Array(1001).fill(validPoses[0]);
      const result = validatePoses(largePosesArray);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('maximum 1000');
    });

    test('should identify specific pose with error', () => {
      const posesWithError = [
        validPoses[0],
        { // Invalid pose without keypoints
          score: 0.85
        }
      ];
      
      const result = validatePoses(posesWithError);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Pose at index 1');
    });
  });

  describe('validateInputs', () => {
    const validInputs = {
      session: 'test_session',
      sequence: 'test_sequence',
      poses: [
        {
          keypoints: [
            { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
          ],
          score: 0.85
        }
      ],
      tag: 'test_tag',
      frame: null,
      options: { saveFrame: false }
    };

    test('should validate all correct inputs', () => {
      const result = validateInputs(validInputs);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.errors).toEqual([]);
    });

    test('should accumulate multiple errors', () => {
      const invalidInputs = {
        session: '', // Invalid
        sequence: '', // Invalid
        poses: [], // Invalid
        tag: '', // Invalid
        frame: null,
        options: { saveFrame: false }
      };
      
      const result = validateInputs(invalidInputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.error).toContain('Session must be a non-empty string');
      expect(result.error).toContain('Sequence must be a non-empty string');
      expect(result.error).toContain('Poses array cannot be empty');
      expect(result.error).toContain('Tag must be a non-empty string');
    });

    test('should validate frame when saveFrame is true', () => {
      const inputsWithInvalidFrame = {
        ...validInputs,
        frame: 'invalid-frame-data',
        options: { saveFrame: true }
      };
      
      const result = validateInputs(inputsWithInvalidFrame);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Frame validation failed');
    });

    test('should accept valid base64 frame', () => {
      const inputsWithValidFrame = {
        ...validInputs,
        frame: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
        options: { saveFrame: true }
      };
      
      const result = validateInputs(inputsWithValidFrame);
      expect(result.isValid).toBe(true);
    });

    test('should reject session with special characters', () => {
      const inputsWithBadSession = {
        ...validInputs,
        session: 'test@session!'
      };
      
      const result = validateInputs(inputsWithBadSession);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('alphanumeric characters');
    });

    test('should reject very long tags', () => {
      const inputsWithLongTag = {
        ...validInputs,
        tag: 'a'.repeat(101) // 101 characters
      };
      
      const result = validateInputs(inputsWithLongTag);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('less than 100 characters');
    });
  });
});

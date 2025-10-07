/**
 * Integration tests for the complete tagger workflow
 */

const { addSequence } = require('../src/tagger');

describe('Integration Tests', () => {
  const mockValidSequence = {
    session: 'integration_test',
    sequence: 'walking_sequence_01',
    poses: [
      {
        keypoints: [
          { part: 'nose', position: { x: 320, y: 240 }, score: 0.95 },
          { part: 'leftEye', position: { x: 310, y: 230 }, score: 0.9 },
          { part: 'rightEye', position: { x: 330, y: 230 }, score: 0.88 },
          { part: 'leftShoulder', position: { x: 280, y: 300 }, score: 0.92 },
          { part: 'rightShoulder', position: { x: 360, y: 300 }, score: 0.89 }
        ],
        score: 0.9,
        timestamp: 1234567890
      },
      {
        keypoints: [
          { part: 'nose', position: { x: 322, y: 242 }, score: 0.93 },
          { part: 'leftEye', position: { x: 312, y: 232 }, score: 0.88 },
          { part: 'rightEye', position: { x: 332, y: 232 }, score: 0.86 },
          { part: 'leftShoulder', position: { x: 282, y: 302 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 362, y: 302 }, score: 0.87 }
        ],
        score: 0.88,
        timestamp: 1234567891
      }
    ],
    tag: 'walking_forward',
    options: { saveFrame: false }
  };

  describe('Complete Workflow', () => {
    test('should process valid sequence end-to-end', () => {
      const result = addSequence(
        mockValidSequence.session,
        mockValidSequence.sequence,
        mockValidSequence.poses,
        mockValidSequence.tag,
        null, // frame
        mockValidSequence.options
      );
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.session).toBe('integration_test');
      expect(result.data.sequence).toBe('walking_sequence_01');
      expect(result.data.tag).toBe('walking_forward');
      expect(result.data.poses).toHaveLength(2);
      
      // Check that poses are normalized to 17 keypoints
      result.data.poses.forEach(pose => {
        expect(pose.keypoints).toHaveLength(17);
      });
    });

    test('should generate unique IDs for different sequences', () => {
      const result1 = addSequence(
        mockValidSequence.session,
        mockValidSequence.sequence,
        mockValidSequence.poses,
        mockValidSequence.tag,
        null,
        mockValidSequence.options
      );
      const result2 = addSequence(
        mockValidSequence.session,
        'walking_sequence_02',
        mockValidSequence.poses,
        mockValidSequence.tag,
        null,
        mockValidSequence.options
      );
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data.id).not.toBe(result2.data.id);
    });

    test('should handle sequences with mixed keypoint counts', () => {
      const mixedSequence = {
        ...mockValidSequence,
        poses: [
          {
            // Pose with many keypoints
            keypoints: [
              { part: 'nose', position: { x: 320, y: 240 }, score: 0.95 },
              { part: 'leftEye', position: { x: 310, y: 230 }, score: 0.9 },
              { part: 'rightEye', position: { x: 330, y: 230 }, score: 0.88 },
              { part: 'leftEar', position: { x: 300, y: 235 }, score: 0.85 },
              { part: 'rightEar', position: { x: 340, y: 235 }, score: 0.83 },
              { part: 'leftShoulder', position: { x: 280, y: 300 }, score: 0.92 },
              { part: 'rightShoulder', position: { x: 360, y: 300 }, score: 0.89 },
              { part: 'leftElbow', position: { x: 250, y: 380 }, score: 0.8 },
              { part: 'rightElbow', position: { x: 390, y: 380 }, score: 0.78 },
              { part: 'leftWrist', position: { x: 220, y: 450 }, score: 0.75 },
              { part: 'rightWrist', position: { x: 420, y: 450 }, score: 0.73 },
              { part: 'leftHip', position: { x: 290, y: 500 }, score: 0.9 },
              { part: 'rightHip', position: { x: 350, y: 500 }, score: 0.88 },
              { part: 'leftKnee', position: { x: 285, y: 600 }, score: 0.85 },
              { part: 'rightKnee', position: { x: 355, y: 600 }, score: 0.83 },
              { part: 'leftAnkle', position: { x: 280, y: 700 }, score: 0.8 },
              { part: 'rightAnkle', position: { x: 360, y: 700 }, score: 0.78 }
            ],
            score: 0.9
          },
          {
            // Pose with few keypoints
            keypoints: [
              { part: 'nose', position: { x: 322, y: 242 }, score: 0.93 },
              { part: 'leftShoulder', position: { x: 282, y: 302 }, score: 0.9 }
            ],
            score: 0.7
          }
        ]
      };
      
      const result = addSequence(
        mixedSequence.session,
        mixedSequence.sequence,
        mixedSequence.poses,
        mixedSequence.tag,
        null,
        mixedSequence.options
      );
      
      expect(result.success).toBe(true);
      result.data.poses.forEach(pose => {
        expect(pose.keypoints).toHaveLength(17);
      });
    });

    test('should preserve temporal order and timestamps', () => {
      const temporalSequence = {
        ...mockValidSequence,
        poses: [
          {
            keypoints: [
              { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
            ],
            score: 0.9,
            timestamp: 1000
          },
          {
            keypoints: [
              { part: 'nose', position: { x: 322, y: 242 }, score: 0.88 }
            ],
            score: 0.88,
            timestamp: 2000
          },
          {
            keypoints: [
              { part: 'nose', position: { x: 324, y: 244 }, score: 0.86 }
            ],
            score: 0.86,
            timestamp: 3000
          }
        ]
      };
      
      const result = addSequence(
        temporalSequence.session,
        temporalSequence.sequence,
        temporalSequence.poses,
        temporalSequence.tag,
        null,
        temporalSequence.options
      );
      
      expect(result.success).toBe(true);
      expect(result.data.poses[0].timestamp).toBe(1000);
      expect(result.data.poses[1].timestamp).toBe(2000);
      expect(result.data.poses[2].timestamp).toBe(3000);
    });

    test('should handle validation errors gracefully', () => {
      const result = addSequence(
        '', // Invalid: empty session
        'test_sequence',
        [
          {
            keypoints: [
              { part: 'nose', position: { x: 320, y: 240 }, score: 0.9 }
            ],
            score: 0.9
          }
        ],
        'test_tag',
        null,
        { saveFrame: false }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Session must be a non-empty string');
      expect(result.data).toBeUndefined();
    });

    test('should handle pose validation errors', () => {
      const result = addSequence(
        'test_session',
        'test_sequence',
        [
          {
            keypoints: [
              { part: 'nose', position: { x: 320, y: 240 }, score: 1.5 } // Invalid score > 1
            ],
            score: 0.9
          }
        ],
        'test_tag',
        null,
        { saveFrame: false }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 1');
      expect(result.data).toBeUndefined();
    });

    test('should include metadata in the output', () => {
      const result = addSequence(
        mockValidSequence.session,
        mockValidSequence.sequence,
        mockValidSequence.poses,
        mockValidSequence.tag,
        null,
        mockValidSequence.options
      );
      
      expect(result.success).toBe(true);
      expect(result.data.metadata).toBeDefined();
      expect(result.data.timestamp).toBeDefined();
      expect(result.data.metadata.pose_count).toBe(2);
      expect(result.data.frame_reference).toBeNull(); // saveFrame is false
    });

    test('should handle large sequences efficiently', () => {
      const largePoses = Array.from({ length: 100 }, (_, i) => ({
        keypoints: [
          { part: 'nose', position: { x: 320 + i, y: 240 + i }, score: 0.9 }
        ],
        score: 0.9,
        timestamp: 1000 + i * 33 // ~30fps
      }));
      
      const startTime = Date.now();
      const result = addSequence(
        mockValidSequence.session,
        mockValidSequence.sequence,
        largePoses,
        mockValidSequence.tag,
        null,
        mockValidSequence.options
      );
      const processingTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.data.poses).toHaveLength(100);
      expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
      
      // All poses should be normalized
      result.data.poses.forEach(pose => {
        expect(pose.keypoints).toHaveLength(17);
      });
    });
  });

  describe('JSONL Output Format', () => {
    test('should produce valid JSONL serializable data', () => {
      const result = addSequence(
        mockValidSequence.session,
        mockValidSequence.sequence,
        mockValidSequence.poses,
        mockValidSequence.tag,
        null,
        mockValidSequence.options
      );
      
      expect(result.success).toBe(true);
      
      // Should be serializable to JSONL
      const jsonlLine = JSON.stringify(result.data);
      expect(() => JSON.parse(jsonlLine)).not.toThrow();
      
      // Parse it back and verify structure
      const parsed = JSON.parse(jsonlLine);
      expect(parsed.id).toBeDefined();
      expect(parsed.session).toBe('integration_test');
      expect(parsed.sequence).toBe('walking_sequence_01');
      expect(parsed.tag).toBe('walking_forward');
      expect(Array.isArray(parsed.poses)).toBe(true);
    });

    test('should maintain data integrity through JSON round-trip', () => {
      const result = addSequence(
        mockValidSequence.session,
        mockValidSequence.sequence,
        mockValidSequence.poses,
        mockValidSequence.tag,
        null,
        mockValidSequence.options
      );
      
      expect(result.success).toBe(true);
      
      const serialized = JSON.stringify(result.data);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.session).toBe(result.data.session);
      expect(deserialized.sequence).toBe(result.data.sequence);
      expect(deserialized.tag).toBe(result.data.tag);
      expect(deserialized.poses).toHaveLength(result.data.poses.length);
      
      // Deep comparison of first pose
      expect(deserialized.poses[0].confidence).toBe(result.data.poses[0].confidence);
      expect(deserialized.poses[0].timestamp).toBe(result.data.poses[0].timestamp);
      expect(deserialized.poses[0].keypoints).toHaveLength(17);
    });
  });
});

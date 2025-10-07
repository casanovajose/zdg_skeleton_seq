/**
 * Example usage of zdg_skeleton_seq in an Electron app
 */

// In main process (main.js)
const { app, BrowserWindow } = require('electron');
const { setupSequenceHandler } = require('zdg_skeleton_seq/electron');

app.whenReady().then(() => {
  // Setup IPC handlers for sequence operations
  setupSequenceHandler();
  
  // Create window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  mainWindow.loadFile('index.html');
});

// In renderer process (renderer.js)
const { addSequence } = require('zdg_skeleton_seq');

// Example: Capture poses and save sequence
class PoseRecorder {
  constructor() {
    this.isRecording = false;
    this.currentSession = 'training_session_1';
    this.currentTag = null;
    this.recordedPoses = [];
    this.sequenceCounter = 0;
  }
  
  startRecording(tag) {
    this.isRecording = true;
    this.currentTag = tag;
    this.recordedPoses = [];
    console.log(`Started recording poses for tag: ${tag}`);
  }
  
  stopRecording() {
    this.isRecording = false;
    console.log(`Stopped recording. Captured ${this.recordedPoses.length} poses`);
  }
  
  // Call this in your pose detection loop
  async onPoseDetected(poses, frameData = null) {
    if (!this.isRecording || !this.currentTag) return;
    
    // Add timestamp to poses
    const timestampedPoses = poses.map(pose => ({
      ...pose,
      timestamp: Date.now()
    }));
    
    // Add to recorded poses
    this.recordedPoses.push(...timestampedPoses);
    
    // Auto-save every 30 poses or when stopped
    if (this.recordedPoses.length >= 30) {
      await this.saveCurrentSequence(frameData);
    }
  }
  
  async saveCurrentSequence(frameData = null) {
    if (this.recordedPoses.length === 0) return;
    
    try {
      const sequenceId = `${this.currentTag}_${Date.now()}_${this.sequenceCounter++}`;
      
      const result = await addSequence(
        this.currentSession,           // session
        sequenceId,                   // sequence
        this.recordedPoses,           // poses
        this.currentTag,              // tag
        frameData,                    // frame (optional)
        { 
          saveFrame: frameData !== null,
          normalizeScale: true,
          includeMetadata: true
        }
      );
      
      if (result.success) {
        console.log('Sequence saved:', {
          id: result.data.id,
          poseCount: result.data.poseCount,
          tag: this.currentTag
        });
        
        // Clear recorded poses for next sequence
        this.recordedPoses = [];
        
        return result;
      } else {
        console.error('Failed to save sequence:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error saving sequence:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get current session statistics
  async getSessionStats() {
    try {
      const sessions = await require('zdg_skeleton_seq').listSessions();
      const currentSessionData = sessions.sessions?.find(s => s.name === this.currentSession);
      
      if (currentSessionData && currentSessionData.metadata) {
        return {
          sequenceCount: currentSessionData.metadata.sequence_count,
          totalFrames: currentSessionData.metadata.statistics.total_frames,
          tags: currentSessionData.metadata.tags,
          poseDistribution: currentSessionData.metadata.statistics.pose_distribution
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading session stats:', error);
      return null;
    }
  }
}

// Example integration with pose detection
class PoseDetectionApp {
  constructor() {
    this.poseRecorder = new PoseRecorder();
    this.video = null;
    this.canvas = null;
    this.isDetecting = false;
  }
  
  async init() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    
    // Setup UI
    this.setupUI();
    
    // Initialize pose detection (assuming you have PoseNet loaded)
    await this.initPoseNet();
  }
  
  setupUI() {
    // Recording controls
    document.getElementById('startRecording').addEventListener('click', () => {
      const tag = document.getElementById('tagInput').value.trim();
      if (tag) {
        this.poseRecorder.startRecording(tag);
        this.updateUI('recording', tag);
      }
    });
    
    document.getElementById('stopRecording').addEventListener('click', async () => {
      this.poseRecorder.stopRecording();
      
      // Save any remaining poses
      const frameData = this.captureFrame();
      await this.poseRecorder.saveCurrentSequence(frameData);
      
      this.updateUI('stopped');
    });
    
    // Session stats
    document.getElementById('showStats').addEventListener('click', async () => {
      const stats = await this.poseRecorder.getSessionStats();
      this.displayStats(stats);
    });
  }
  
  async initPoseNet() {
    // Your PoseNet initialization code
    // this.poseNet = await posenet.load();
  }
  
  async detectPoses() {
    if (!this.isDetecting) return;
    
    try {
      // Your pose detection code
      // const poses = await this.poseNet.estimateMultiplePoses(this.video);
      
      // Mock poses for example
      const poses = this.getMockPoses();
      
      // Send to recorder
      const frameData = this.poseRecorder.isRecording ? this.captureFrame() : null;
      await this.poseRecorder.onPoseDetected(poses, frameData);
      
      // Continue detection loop
      requestAnimationFrame(() => this.detectPoses());
      
    } catch (error) {
      console.error('Pose detection error:', error);
    }
  }
  
  captureFrame() {
    if (!this.canvas || !this.video) return null;
    
    // Draw current video frame to canvas
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    // Return as base64 data URL
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }
  
  getMockPoses() {
    // Mock pose data for example
    return [{
      keypoints: [
        { part: 'nose', position: { x: 320, y: 200 }, score: 0.9 },
        { part: 'leftEye', position: { x: 310, y: 190 }, score: 0.8 },
        // ... more keypoints
      ],
      score: 0.85
    }];
  }
  
  updateUI(state, tag = null) {
    const status = document.getElementById('status');
    const recordBtn = document.getElementById('startRecording');
    const stopBtn = document.getElementById('stopRecording');
    
    switch (state) {
      case 'recording':
        status.textContent = `Recording: ${tag}`;
        status.className = 'recording';
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        break;
      case 'stopped':
        status.textContent = 'Ready';
        status.className = 'ready';
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        break;
    }
  }
  
  displayStats(stats) {
    if (!stats) {
      console.log('No session data available');
      return;
    }
    
    console.log('Session Statistics:', {
      sequences: stats.sequenceCount,
      totalFrames: stats.totalFrames,
      tags: stats.tags,
      distribution: stats.poseDistribution
    });
    
    // Update UI with stats
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = `
      <h3>Session Statistics</h3>
      <p>Sequences: ${stats.sequenceCount}</p>
      <p>Total Frames: ${stats.totalFrames}</p>
      <p>Tags: ${stats.tags.join(', ')}</p>
      <p>Distribution: ${JSON.stringify(stats.poseDistribution, null, 2)}</p>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PoseDetectionApp();
  app.init();
});

module.exports = { PoseRecorder, PoseDetectionApp };

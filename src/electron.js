/**
 * Electron integration for zdg_skeleton_seq
 * Handles IPC communication between renderer and main process
 */

const { ipcMain } = require('electron');
const { appendToSessionFile, saveFrameImage, listSessions, loadSessionMetadata } = require('./session');

/**
 * Setup IPC handlers for Electron main process
 */
const setupSequenceHandler = () => {
  // Handle sequence data saving
  ipcMain.handle('zdg-save-sequence', async (event, sequenceData) => {
    try {
      const { sessionPath, data, frameData, frameReference } = sequenceData;
      
      // Save sequence data to JSONL file
      const saveResult = await appendToSessionFile(sessionPath, data);
      
      if (!saveResult.success) {
        return saveResult;
      }
      
      // Save frame image if provided
      let frameResult = { success: true };
      if (frameData && frameReference) {
        frameResult = await saveFrameImage(frameReference, frameData);
      }
      
      return {
        success: true,
        data: {
          sequenceId: data.id,
          sessionPath,
          frameReference: frameResult.success ? frameReference : null,
          timestamp: data.timestamp
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'ELECTRON_SAVE_ERROR'
      };
    }
  });
  
  // Handle session listing
  ipcMain.handle('zdg-list-sessions', async (event, dataDir) => {
    return await listSessions(dataDir);
  });
  
  // Handle session metadata loading
  ipcMain.handle('zdg-load-session-metadata', async (event, sessionPath) => {
    return await loadSessionMetadata(sessionPath);
  });
  
  // Handle session validation
  ipcMain.handle('zdg-validate-session', async (event, sessionName) => {
    try {
      const sanitizedName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');
      return {
        success: true,
        valid: sanitizedName.length > 0 && sanitizedName.length <= 50,
        sanitized: sanitizedName
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  console.log('ZDG Skeleton Sequence IPC handlers registered');
};

/**
 * Remove IPC handlers (cleanup)
 */
const removeSequenceHandlers = () => {
  ipcMain.removeHandler('zdg-save-sequence');
  ipcMain.removeHandler('zdg-list-sessions');
  ipcMain.removeHandler('zdg-load-session-metadata');
  ipcMain.removeHandler('zdg-validate-session');
  
  console.log('ZDG Skeleton Sequence IPC handlers removed');
};

/**
 * Get Electron-specific configuration
 */
const getElectronConfig = () => ({
  dataPath: './data/sessions',
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'],
  maxSequenceLength: 1000,
  defaultOptions: {
    saveFrame: false,
    normalizeScale: false,
    includeMetadata: true
  }
});

module.exports = {
  setupSequenceHandler,
  removeSequenceHandlers,
  getElectronConfig
};

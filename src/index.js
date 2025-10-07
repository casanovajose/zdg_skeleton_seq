/**
 * zdg_skeleton_seq - Main entry point
 * Functional approach for skeleton sequence data tagging
 */

// Detect environment
const isElectronRenderer = typeof window !== 'undefined' && 
                          typeof window.require !== 'undefined' && 
                          window.require('electron');

const isNode = typeof process !== 'undefined' && 
               process.versions && 
               Boolean(process.versions.node) &&
               !isElectronRenderer;

// Load appropriate implementation
let coreImplementation;

if (isElectronRenderer) {
  // Electron renderer process - use IPC version
  coreImplementation = require('./renderer');
} else if (isNode) {
  // Node.js - use direct file operations
  coreImplementation = require('./tagger');
} else {
  // Browser - limited functionality
  const { normalizePoses } = require('./normalizer');
  const { validateInputs } = require('./utils/validation');
  const { generateSequenceId } = require('./utils/encoding');
  
  coreImplementation = {
    addSequence: () => {
      throw new Error('addSequence requires Electron or Node.js environment for file operations');
    },
    // Provide utilities that work in browser
    normalizePoses,
    validateInputs,
    generateSequenceId
  };
}

// Common utilities available in all environments
const { normalizeKeypoints, normalizePoses } = require('./normalizer');
const { validateInputs, validatePoses } = require('./utils/validation');
const { generateSequenceId, generateFrameReference } = require('./utils/encoding');

// Advanced utilities (Node.js only)
let dataAnalytics = null;
let snapshotRenderer = null;

if (isNode) {
  try {
    dataAnalytics = require('./utils/data-analytics');
    snapshotRenderer = require('./utils/snapshot-renderer');
  } catch (error) {
    console.warn('Advanced utilities not available:', error.message);
  }
}

// Main exports
module.exports = {
  // Core functionality (environment-dependent)
  addSequence: coreImplementation.addSequence,
  
  // Utilities for advanced usage (available everywhere)
  normalizeKeypoints,
  normalizePoses,
  validateInputs,
  validatePoses,
  generateSequenceId,
  generateFrameReference,
  
  // Data utilities (Node.js only)
  collectAllTags: dataAnalytics?.collectAllTags || null,
  
  // Snapshot rendering utilities (Node.js only)
  renderSnapshotPictures: snapshotRenderer?.renderSnapshotPictures || null,
  
  // Environment utilities (if available)
  listSessions: coreImplementation.listSessions || null,
  loadSessionMetadata: coreImplementation.loadSessionMetadata || null,
  validateSession: coreImplementation.validateSession || null,
  
  // Version and environment info
  version: require('../package.json').version,
  environment: isElectronRenderer ? 'electron-renderer' : 
               isNode ? 'node' : 'browser'
};

// Browser global export
if (typeof window !== 'undefined') {
  window.ZdgSkeletonSeq = module.exports;
}

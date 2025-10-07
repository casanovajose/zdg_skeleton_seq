/**
 * Encoding and ID generation utilities - Pure functions
 */

const crypto = require('crypto');

/**
 * Generate unique sequence ID - Pure function
 */
const generateSequenceId = (session, sequence) => {
  const timestamp = Date.now();
  const sessionPart = sanitizeString(session).substring(0, 8);
  const sequencePart = sanitizeString(sequence).substring(0, 12);
  const randomPart = generateRandomString(4);
  
  return `${sessionPart}_${sequencePart}_${timestamp}_${randomPart}`;
};

/**
 * Generate frame reference path - Pure function
 */
const generateFrameReference = (session, sequence, dataPath = './data') => {
  const timestamp = Date.now();
  const sessionPart = sanitizeString(session);
  const sequencePart = sanitizeString(sequence);
  
  return `${dataPath}/sessions/${sessionPart}/frames/${sequencePart}_${timestamp}.jpg`;
};

/**
 * Generate session directory path - Pure function
 */
const generateSessionPath = (session) => {
  const sanitizedSession = sanitizeString(session);
  return `./data/sessions/${sanitizedSession}`;
};

/**
 * Sanitize string for file system usage - Pure function
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') {
    return 'unknown';
  }
  
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_') // Replace invalid chars with underscore
    .replace(/_+/g, '_')          // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')      // Remove leading/trailing underscores
    .substring(0, 50);            // Limit length
};

/**
 * Generate random string - Uses Math.random() for true randomness
 */
const generateRandomString = (length = 8) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * characters.length);
    result += characters.charAt(index);
  }
  
  return result;
};

/**
 * Generate hash from data - Pure function
 */
const generateHash = (data, algorithm = 'md5') => {
  if (typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  
  return crypto
    .createHash(algorithm)
    .update(data)
    .digest('hex')
    .substring(0, 8); // Short hash
};

/**
 * Encode frame data for storage - Pure function
 */
const encodeFrameData = (frameData) => {
  if (!frameData || typeof frameData !== 'string') {
    return null;
  }
  
  // Extract image type and data from data URL
  const matches = frameData.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  
  return {
    type: matches[1],
    data: matches[2],
    size: Math.round((matches[2].length * 0.75) / 1024), // Approximate size in KB
    timestamp: Date.now()
  };
};

/**
 * Create file name from frame reference - Pure function
 */
const createFrameFileName = (session, sequence, extension = 'jpg') => {
  const timestamp = Date.now();
  const sessionPart = sanitizeString(session);
  const sequencePart = sanitizeString(sequence);
  
  return `${sessionPart}_${sequencePart}_${timestamp}.${extension}`;
};

/**
 * Parse frame reference to get components - Pure function
 */
const parseFrameReference = (frameReference) => {
  if (!frameReference || typeof frameReference !== 'string') {
    return null;
  }
  
  // Expected format: "session/frames/sequence_timestamp.jpg"
  const parts = frameReference.split('/');
  if (parts.length < 3) {
    return null;
  }
  
  const session = parts[0];
  const fileName = parts[parts.length - 1];
  const fileNameParts = fileName.split('.');
  
  return {
    session,
    fileName,
    extension: fileNameParts[fileNameParts.length - 1],
    fullPath: frameReference
  };
};

/**
 * Generate unique identifier - Pure function
 */
const generateUUID = () => {
  // Simple UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Create timestamp string - Pure function
 */
const createTimestamp = (date = new Date()) => {
  return date.toISOString().replace(/[:.]/g, '-').split('.')[0];
};

/**
 * Validate ID format - Pure function
 */
const validateId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Check if ID matches expected pattern
  const idPattern = /^[a-z0-9_-]+$/;
  return idPattern.test(id) && id.length >= 3 && id.length <= 100;
};

/**
 * Create backup filename - Pure function
 */
const createBackupFileName = (originalPath) => {
  const timestamp = createTimestamp();
  const pathParts = originalPath.split('.');
  
  if (pathParts.length > 1) {
    const extension = pathParts.pop();
    return `${pathParts.join('.')}_backup_${timestamp}.${extension}`;
  }
  
  return `${originalPath}_backup_${timestamp}`;
};

/**
 * Extract metadata from filename - Pure function
 */
const extractMetadataFromFilename = (filename) => {
  const parts = filename.split('_');
  const timestamp = parts.find(part => /^\d{13}$/.test(part)); // 13-digit timestamp
  
  return {
    filename,
    timestamp: timestamp ? parseInt(timestamp) : null,
    date: timestamp ? new Date(parseInt(timestamp)) : null,
    parts
  };
};

module.exports = {
  generateSequenceId,
  generateFrameReference,
  generateSessionPath,
  sanitizeString,
  generateRandomString,
  generateHash,
  encodeFrameData,
  createFrameFileName,
  parseFrameReference,
  generateUUID,
  createTimestamp,
  validateId,
  createBackupFileName,
  extractMetadataFromFilename
};

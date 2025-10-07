/**
 * Data utilities - Simple tag collection
 * Keep it simple - just what's needed
 */

const fs = require('fs');
const path = require('path');

/**
 * Collect all unique tags from JSONL files in project folder
 * @param {string} projectPath - Path to project data folder
 * @returns {Promise<string[]>} Array of unique tags
 */
const collectAllTags = async (projectPath) => {
  try {
    const tags = new Set();
    
    // Find all sessions folders
    const sessionsPath = path.join(projectPath, 'sessions');
    if (!fs.existsSync(sessionsPath)) {
      return [];
    }
    
    const sessionDirs = fs.readdirSync(sessionsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Process each session
    for (const sessionDir of sessionDirs) {
      const sequencesFile = path.join(sessionsPath, sessionDir, 'sequences.jsonl');
      
      if (fs.existsSync(sequencesFile)) {
        const fileContent = fs.readFileSync(sequencesFile, 'utf8');
        const lines = fileContent.trim().split('\n').filter(line => line.trim());
        
        // Parse each JSONL line and extract tags
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.tag && typeof data.tag === 'string') {
              tags.add(data.tag.trim());
            }
          } catch (parseError) {
            console.warn(`Error parsing line in ${sequencesFile}:`, parseError.message);
          }
        }
      }
    }
    
    return Array.from(tags).sort();
  } catch (error) {
    throw new Error(`Failed to collect tags: ${error.message}`);
  }
};

module.exports = {
  collectAllTags
};

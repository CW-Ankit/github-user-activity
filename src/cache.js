import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CACHE_CONFIG } from './constants.js';

/**
 * Cache Manager
 *
 * This module handles the persistence of API responses to the local file system.
 * This prevents redundant network calls and protects against GitHub API rate limiting.
 *
 * Documentation for used modules:
 * - node:fs/promises: https://nodejs.org/api/fs.html#promises-api
 * - node:path: https://nodejs.org/api/path.html
 * - node:os: https://nodejs.org/api/os.html
 */

// Use the system's temporary directory to store cache files.
// os.tmpdir() returns the operating system's default directory for temporary files.
const CACHE_DIR = path.join(os.tmpdir(), 'github-activity-cache');

/**
 * Retrieves data from the local cache if it exists and has not expired.
 *
 * Algorithm:
 * 1. Construct the file path based on a unique key.
 * 2. Check if the file exists using fs.stat().
 * 3. Compare current time with the file's modification time (mtimeMs).
 * 4. If (Current Time - Modification Time) < TTL, the cache is valid.
 *
 * @param {string} key - Unique identifier for the resource (e.g., "users_username").
 * @returns {Promise<any|null>} - Returns parsed JSON data if cache hit, otherwise null.
 */
export async function getCachedData(key) {
  try {
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    const stats = await fs.stat(cachePath);
    const now = Date.now();

    // TTL (Time To Live) Check
    if (now - stats.mtimeMs < CACHE_CONFIG.TTL) {
      const data = await fs.readFile(cachePath, 'utf8');
      return JSON.parse(data);
    }
  } catch {
    // Error here usually means the file does not exist (Cache Miss)
  }
  return null;
}

/**
 * Saves data to the local cache directory.
 *
 * @param {string} key - Unique identifier for the resource.
 * @param {any} data - The data to be cached (will be stringified to JSON).
 * @returns {Promise<void>}
 */
export async function setCachedData(key, data) {
  try {
    // Ensure the cache directory exists. recursive: true handles nested paths.
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cachePath = path.join(CACHE_DIR, `${key}.json`);

    // Write the data as a JSON string to the temporary directory.
    await fs.writeFile(cachePath, JSON.stringify(data), 'utf8');
  } catch (e) {
    // Fail silently: caching is a performance optimization, not a critical failure point.
    console.error(`Cache write error: ${e.message}`);
  }
}

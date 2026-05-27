/**
 * Constants and configuration for the GitHub Activity CLI.
 *
 * This file centralizes all configuration and styling constants to ensure consistency
 * across the application and ease of maintenance.
 */

/**
 * ANSI Escape Codes for Terminal Styling.
 *
 * ANSI escape codes are a standard for controlling cursor location, color, and other options
 * on in-computer terminals.
 * Documentation: https://en.wikipedia.org/wiki/ANSI_escape_code
 */
export const COLORS = {
  reset: '\x1b[0m', // Resets all colors to default
  bright: '\x1b[1m', // Bold/Bright text
  green: '\x1b[32m', // Green text
  yellow: '\x1b[33m', // Yellow text
  blue: '\x1b[34m', // Blue text
  magenta: '\x1b[35m', // Magenta text
  cyan: '\x1b[36m', // Cyan text
  red: '\x1b[31m', // Red text
  gray: '\x1b[90m', // Bright black (gray) text
};

/**
 * Cache Configuration
 *
 * CACHE_TTL (Time To Live) defines how long a cached response is considered valid.
 * We use 10 minutes (600,000 milliseconds) to balance performance and data freshness.
 */
export const CACHE_CONFIG = {
  TTL: 10 * 60 * 1000, // 10 minutes in milliseconds
};

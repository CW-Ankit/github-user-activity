#!/usr/bin/env node

/**
 * GitHub User Activity CLI - Entry Point
 *
 * This is the bootstrap file for the application. It imports the main
 * CLI controller and executes the application logic.
 *
 * Project Structure:
 * - src/constants.js: Application configuration and styling.
 * - src/cache.js: Local file-system caching logic.
 * - src/api.js: GitHub REST API communication.
 * - src/formatter.js: Data-to-string formatting.
 * - src/cli.js: Main command-line orchestration.
 */

import { run } from './cli.js';

// Execute the CLI application
run().catch((err) => {
  console.error('Unexpected Fatal Error:', err);
  process.exit(1);
});

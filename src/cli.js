import { COLORS } from './constants.js';
import { fetchGitHub } from './api.js';
import { formatEvent, formatProfile } from './formatter.js';

/**
 * CLI Controller
 *
 * This module handles the orchestration of the application. It parses command-line
 * arguments, triggers API calls, and coordinates the display of results.
 */

/**
 * Parses process.argv to extract username and options.
 *
 * @returns {Object} An object containing { username, filterType, showHelp }.
 */
function parseArguments() {
  const args = process.argv.slice(2);

  // Find the first argument that doesn't start with '-' as the username
  const username = args.find((arg) => !arg.startsWith('-'));

  // Look for --filter=Type arguments
  const filterArg = args.find((arg) => arg.startsWith('--filter='));
  const filterType = filterArg ? filterArg.split('=')[1] : null;

  // Check for help flags
  const showHelp = args.includes('-h') || args.includes('--help');

  return { username, filterType, showHelp };
}

/**
 * Prints the help manual to the console.
 */
function printHelp() {
  console.log(`
${COLORS.bright}GitHub Activity CLI (Professional)${COLORS.reset}
Usage: 
  github-activity <username> [options]

Options:
  --filter=<eventType>   Filter activity by event type (e.g., PushEvent, WatchEvent)
  -h, --help              Show this help message

Example:
  github-activity gaearon --filter=PushEvent
    `);
}

/**
 * Main execution loop for the CLI.
 *
 * Algorithm:
 * 1. Parse command line arguments.
 * 2. Validate input (check if username is provided or help is requested).
 * 3. Execute concurrent API calls for User Profile and Events using Promise.all.
 * 4. Format and print the User Profile.
 * 5. Apply filtering logic if a filterType was provided.
 * 6. Loop through events and print formatted output.
 * 7. Catch and display errors using a centralized try-catch block.
 */
export async function run() {
  /**
   * PHASE 1: ARGUMENT PARSING & VALIDATION
   *
   * The application begins by extracting the necessary inputs from the global
   * process.argv array. This ensures that the user has provided a target GitHub
   * username and any optional modifiers (like event filtering).
   *
   * If the user provides the help flag (-h or --help) or fails to provide a
   * username, the application triggers the printHelp() sequence and exits
   * gracefully with a status code of 0.
   */
  const { username, filterType, showHelp } = parseArguments();

  if (showHelp || !username) {
    printHelp();
    process.exit(0);
  }

  try {
    /**
     * PHASE 2: DATA ACQUISITION
     *
     * To minimize total network latency, we execute multiple API requests
     * concurrently using Promise.all(). This is significantly faster than
     * sequential await calls because the Node.js event loop can handle
     * multiple outstanding I/O requests.
     *
     * We fetch two distinct resources:
     * 1. The User Profile: contains basic metadata (name, bio, stats).
     * 2. The User Events: contains a stream of recent public activities.
     *
     * Note: The fetchGitHub function now returns a wrapper object { data, fromCache }.
     */
    console.log(
      `${COLORS.cyan}Fetching profile and activity for ${COLORS.bright}${username}${COLORS.reset}...`
    );

    // Concurrent Requests: We fetch profile and events simultaneously to reduce overall wait time.
    // Documentation on Promise.all: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
    const [userRes, eventsRes] = await Promise.all([
      fetchGitHub(`users/${username}`, username),
      fetchGitHub(`users/${username}/events`, username),
    ]);

    const user = userRes.data;
    const events = eventsRes.data;

    /**
     * CACHE STATUS REPORTING
     *
     * To provide transparency to the user regarding performance, we check the
     * 'fromCache' flag returned by the API layer.
     *
     * - Full Cache Hit: Both profile and events were retrieved from disk.
     * - Partial Cache Hit: Only one of the two was retrieved from disk.
     * - Cache Miss: Both were fetched fresh from the GitHub REST API.
     */
    if (userRes.fromCache && eventsRes.fromCache) {
      console.log(`${COLORS.gray}⚡ Loaded from local cache${COLORS.reset}\n`);
    } else if (userRes.fromCache || eventsRes.fromCache) {
      console.log(`${COLORS.gray}⚡ Partially loaded from cache${COLORS.reset}\n`);
    }

    /**
     * PHASE 3: PROFILE RENDERING
     *
     * Once the user data is retrieved, it is passed to the formatProfile()
     * function. This ensures a strict separation of concerns:
     * the CLI controller manages flow, while the formatter manages aesthetics.
     */
    // Step 1: Display Profile
    console.log(formatProfile(user));

    /**
     * PHASE 4: EVENT PROCESSING & FILTERING
     *
     * Before rendering activity, we must handle edge cases where a user
     * might exist but has no public activity in the recent window.
     */
    // Step 2: Handle Empty Events
    if (!events || events.length === 0) {
      console.log('No recent activity found for this user.');
      return;
    }

    /**
     * DYNAMIC FILTERING
     *
     * If the user specified a --filter=Type argument, we apply a predicate
     * filter to the event array. This allows users to isolate specific
     * activities (e.g., only looking for 'PushEvent').
     */
    // Step 3: Filter Events if requested
    let filteredEvents = events;
    if (filterType) {
      filteredEvents = events.filter((e) => e.type === filterType);
      console.log(`${COLORS.yellow}Filtering by: ${filterType}${COLORS.reset}\n`);
    }

    if (filteredEvents.length === 0) {
      console.log(`No events of type ${filterType} found.`);
      return;
    }

    /**
     * PHASE 5: FINAL OUTPUT RENDERING
     *
     * The activity feed is rendered as a structured table.
     * We first print a header row for clarity, then iterate through
     * the filtered events, formatting each one as a data row.
     */
    // Step 4: Display Activity
    console.log(`${COLORS.bright}Recent Activity:${COLORS.reset}`);

    // Table Header: Aligned with the padding used in formatEvent()
    console.log(
      `${COLORS.gray}${'Date'.padEnd(20)} | ${'Type'.padEnd(12)} | ${'Repository'.padEnd(25)} | ${'Detail'}${COLORS.reset}`
    );
    console.log(`${COLORS.gray}${' '.repeat(75)}${COLORS.reset}`);

    filteredEvents.forEach((event) => {
      console.log(formatEvent(event));
    });
  } catch (error) {
    /**
     * GLOBAL ERROR HANDLER
     *
     * This block catches all synchronous and asynchronous errors, including:
     * - 404 Not Found (User does not exist)
     * - 403 Forbidden (Rate limit exceeded)
     * - Network timeouts or DNS failures
     * - JSON parsing errors
     *
     * The error is printed in red to the stderr stream, and the process exits
     * with a non-zero status code (1) to signal failure to the shell.
     */
    // Centralized error handling for API, Network, and Parsing errors
    console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

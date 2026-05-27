import { COLORS } from './constants.js';

/**
 * ============================================================================
 * DISPLAY FORMATTER MODULE
 * ============================================================================
 *
 * This module is responsible for the 'View' layer of the application. It
 * transforms raw JSON data retrieved from the GitHub API into human-readable,
 * visually structured strings specifically designed for terminal output.
 *
 * DESIGN PHILOSOPHY:
 * The formatter employs a 'Data-to-String' mapping strategy. It avoids
 * introducing any business logic or network calls, ensuring that the
 * visual representation can be tested independently of the API.
 *
 * Visual enhancements include:
 * - ANSI Color Coding: Using colors to categorize event types.
 * - Columnar Alignment: Using string padding to create a table-like view.
 * - Semantic Icons: Using emojis to provide quick visual cues.
 * ============================================================================
 */

/**
 * Formats a single GitHub event into a structured, aligned row.
 *
 * ============================================================================
 * FORMATTING LOGIC:
 *
 * 1. TIME NORMALIZATION:
 *    The raw ISO date string is converted into a localized, shortened format
 *    (e.g., 'Oct 12, 10:30 am') to maximize space in the terminal.
 *
 * 2. SEMANTIC MAPPING:
 *    A switch statement maps GitHub's internal event types to a consistent
 *    set of labels, colors, and icons:
 *    - PushEvent    -> 🚀 PUSH    (Green)
 *    - IssuesEvent  -> 🎫 ISSUE   (Yellow)
 *    - WatchEvent   -> ⭐ STAR    (Magenta)
 *    - CreateEvent  -> 🌿 CREATE  (Blue)
 *    - ForkEvent    -> 🍴 FORK    (Blue)
 *    - CommentEvent -> 💬 COMMENT (Yellow)
 *
 * 3. COLUMNAR ALIGNMENT:
 *    To ensure the output looks like a professional table, we use .padEnd().
 *    This forces each column to maintain a fixed width regardless of the
 *    content length, preventing the table from 'shifting' between rows.
 *    - Date: Variable (handled by toLocaleString)
 *    - Type: 10 characters
 *    - Repo: 25 characters (truncated if longer)
 *    - Detail: 20 characters
 * ============================================================================
 *
 * @param {Object} event - The event object from GitHub API.
 * @returns {string} - A formatted row.
 */
export function formatEvent(event) {
  const repoName = event.repo.name;

  // Format date as: "Month Day, HH:MM am/pm"
  const date = new Date(event.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  /**
   * EVENT TYPE CONFIGURATION MAP
   *
   * Instead of a switch statement, we use a mapping object to define the
   * visual properties of each event type. This eliminates redundant assignments
   * and simplifies the lookup process.
   */
  const EVENT_MAP = {
    PushEvent: {
      icon: '🚀',
      label: 'PUSH',
      color: COLORS.green,
      getDetail: (payload) => `${payload.commits ? payload.commits.length : 0} commit(s)`,
    },
    IssuesEvent: {
      icon: '🎫',
      label: 'ISSUE',
      color: COLORS.yellow,
      getDetail: (payload) => (payload.action === 'opened' ? 'Opened' : 'Closed'),
    },
    WatchEvent: {
      icon: '⭐',
      label: 'STAR',
      color: COLORS.magenta,
      getDetail: () => 'Starred',
    },
    CreateEvent: {
      icon: '🌿',
      label: 'CREATE',
      color: COLORS.blue,
      getDetail: (payload) => `Created ${payload.ref_type}`,
    },
    ForkEvent: {
      icon: '🍴',
      label: 'FORK',
      color: COLORS.blue,
      getDetail: () => 'Forked',
    },
    IssueCommentEvent: {
      icon: '💬',
      label: 'COMMENT',
      color: COLORS.yellow,
      getDetail: () => 'Commented',
    },
  };

  // Extract config based on event type, fallback to default if type is unknown.
  const config = EVENT_MAP[event.type] || {
    icon: '🔹',
    label: event.type.replace('Event', '').toUpperCase(),
    color: COLORS.gray,
    getDetail: () => 'Activity',
  };

  const typeLabel = config.label;
  const icon = config.icon;
  const color = config.color;
  const detail = config.getDetail(event.payload);

  /**
   * COLUMN ALIGNMENT CALCULATIONS
   *
   * We apply padding to ensure vertical alignment of the pipes (|).
   * substrings are used to prevent extremely long repository names from
   * breaking the table layout.
   */
  const pType = typeLabel.padEnd(10);
  const pRepo = repoName.padEnd(25).substring(0, 25);
  const pDetail = detail.padEnd(20);

  return `${COLORS.gray}${date}${COLORS.reset} | ${color}${icon} ${pType}${COLORS.reset} | ${COLORS.cyan}${pRepo}${COLORS.reset} | ${pDetail}`;
}

/**
 * Formats the user profile section into a clean card.
 *
 * ============================================================================
 * RENDERING LOGIC:
 *
 * The profile is rendered as a highlighted 'Card' at the top of the output.
 * It uses a horizontal separator line to visually isolate the profile from
 * the activity feed.
 * ============================================================================
 *
 * @param {Object} user - User data from GitHub API.
 * @returns {string} - Formatted profile block.
 */
export function formatProfile(user) {
  const line = '-'.repeat(70);
  return `
${COLORS.bright}👤 USER PROFILE${COLORS.reset}
${line}
${COLORS.green}Name:     ${COLORS.reset}${user.name || 'N/A'}
${COLORS.green}Bio:      ${COLORS.reset}${user.bio || 'N/A'}
${COLORS.green}Repos:    ${COLORS.reset}${user.public_repos}
${COLORS.green}Followers: ${COLORS.reset}${user.followers}
${line}
`;
}

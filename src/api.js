import https from 'node:https';
import { getCachedData, setCachedData } from './cache.js';

/**
 * ============================================================================
 * GITHUB API CLIENT MODULE
 * ============================================================================
 *
 * This module serves as the primary communication bridge between the CLI
 * application and the GitHub REST API. Its primary responsibility is to
 * execute network requests, handle HTTP responses, and integrate a
 * local file-system caching mechanism to minimize API consumption.
 *
 * ARCHITECTURAL DESIGN:
 * The client is designed around the 'Cache-Aside' pattern. Before any
 * network request is initiated, the client checks the local cache.
 * If a valid (non-expired) copy of the data exists, it is returned
 * immediately, bypassing the network entirely.
 *
 * Official GitHub API Documentation: https://docs.github.com/en/rest
 * Node.js HTTPS documentation: https://nodejs.org/api/https.html
 * ============================================================================
 */

/**
 * Generic function to fetch data from a GitHub API endpoint.
 *
 * ============================================================================
 * DETAILED ALGORITHM STEP-BY-STEP:
 *
 * 1. CACHE KEY GENERATION:
 *    The function first creates a unique identifier for the request.
 *    It sanitizes the endpoint (e.g., converting 'users/name' to 'users_name')
 *    and appends the username to ensure that different users requesting
 *    the same endpoint don't collide in the cache.
 *
 * 2. CACHE LOOKUP (READ):
 *    It calls getCachedData(). If a valid JSON object is returned, the
 *    function resolves immediately with a flag 'fromCache: true'.
 *
 * 3. HTTPS REQUEST INITIATION:
 *    If the cache misses, it constructs a full URL and a set of headers.
 *    CRITICAL: GitHub requires a 'User-Agent' header. Without this,
 *    the server will return a 403 Forbidden response.
 *
 * 4. HTTP RESPONSE HANDLING:
 *    - 200 OK: The request was successful. The response body is streamed.
 *    - 404 Not Found: The requested user or resource does not exist.
 *    - Other (4xx/5xx): A generic API error is thrown.
 *
 * 5. DATA STREAMING & PARSING:
 *    Since node:https.get() returns a stream, we accumulate 'chunks' of
 *    data into a string. Once the 'end' event fires, we attempt to
 *    parse this string as JSON.
 *
 * 6. CACHE PERSISTENCE (WRITE):
 *    Successful API responses are written back to the local file system
 *    via setCachedData() to accelerate future requests.
 *
 * 7. ERROR PROPAGATION:
 *    Any network-level failures (DNS, TCP timeouts) are caught by the
 *    '.on('error')' listener and rejected as a Promise.
 * ============================================================================
 *
 * @param {string} endpoint - The API path (e.g., 'users/username/events').
 * @param {string} username - The target GitHub username for cache key generation.
 * @returns {Promise<{data: any, fromCache: boolean}>} - A wrapper containing the data and cache status.
 * @throws {Error} - Throws errors for 404s, API failures, or network issues.
 */
export async function fetchGitHub(endpoint, username) {
  /**
   * Step 1: Cache Lookup
   * Sanitize endpoint by replacing slashes with underscores to create a valid filename.
   * We use the username in the key to prevent cross-user cache pollution.
   */
  const safeEndpoint = endpoint.replace(/\//g, '_');
  const cacheKey = `${safeEndpoint}_${username}`;
  const cached = await getCachedData(cacheKey);

  // If data is found and not expired, return immediately to save network bandwidth and API quota.
  if (cached) return { data: cached, fromCache: true };

  /**
   * If cache lookup fails, we transition to the network layer.
   * We wrap the https.get call in a Promise to allow the use of async/await in the controller.
   */
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/${endpoint}`;

    // GitHub requires a User-Agent header for all API requests.
    // Without it, the API returns a 403 Forbidden error.
    const options = {
      headers: { 'User-Agent': 'Node.js-GitHub-Activity-CLI-Professional' },
    };

    https
      .get(url, options, (res) => {
        let data = '';

        /**
         * HTTP STATUS CODE VALIDATION
         *
         * GitHub API uses standard HTTP status codes:
         * - 200: Success
         * - 403: Rate limit exceeded or Forbidden
         * - 404: Resource Not Found
         */
        if (res.statusCode === 404) {
          return reject(new Error(`Resource not found at ${endpoint}`));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`GitHub API responded with status: ${res.statusCode}`));
        }

        /**
         * DATA STREAMING
         *
         * Response bodies can be large. We listen for the 'data' event
         * to receive the response in chunks.
         */
        res.on('data', (chunk) => {
          data += chunk;
        });

        /**
         * STREAM COMPLETION
         *
         * The 'end' event signifies that the entire response body has been
         * received from the server.
         */
        res.on('end', async () => {
          try {
            const parsed = JSON.parse(data);

            /**
             * PERSIST TO CACHE
             * Store successful response in cache for future requests.
             * This is a fire-and-forget operation; if caching fails, we still return the data.
             */
            await setCachedData(cacheKey, parsed);

            // Resolve with the requested data and a flag indicating this was a fresh fetch.
            resolve({ data: parsed, fromCache: false });
          } catch {
            reject(new Error('Failed to parse JSON response from GitHub API'));
          }
        });
      })
      .on('error', (_err) => {
        /**
         * NETWORK ERROR HANDLING
         *
         * Handles low-level errors such as:
         * - ENOTFOUND: DNS lookup failure
         * - ECONNRESET: Connection reset by peer
         * - ETIMEDOUT: Request timed out
         */
        reject(new Error(`Network error occurred: ${_err.message}`));
      });
  });
}

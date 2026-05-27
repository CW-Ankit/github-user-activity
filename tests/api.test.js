import test from 'node:test';
import assert from 'node:assert';
import { fetchGitHub } from '../src/api.js';

/**
 * API Module Tests
 *
 * These tests verify that the API client correctly handles
 * successful responses and common error scenarios.
 *
 * Note: These are integration tests that make actual network calls to GitHub.
 */

test('fetchGitHub - should fetch a valid user profile', async () => {
  const username = 'gaearon'; // Known active user
  const response = await fetchGitHub(`users/${username}`, username);
  const data = response.data;

  assert.strictEqual(data.login, username);
  assert.ok(data.id);
});

test('fetchGitHub - should throw error for non-existent user', async () => {
  const username = 'this-user-definitely-does-not-exist-123456789';

  await assert.rejects(
    async () => {
      await fetchGitHub(`users/${username}`, username);
    },
    {
      message: /Resource not found/,
    }
  );
});

test('fetchGitHub - should fetch events for a valid user', async () => {
  const username = 'gaearon';
  const response = await fetchGitHub(`users/${username}/events`, username);
  const data = response.data;

  assert.ok(Array.isArray(data));
});

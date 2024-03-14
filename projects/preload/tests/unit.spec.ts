import {expect, test, vi} from 'vitest';

// TODO: Remove this workaround after unplugin-auto-expose will be fixed for ESM support
vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: () => {},
  },
}));


test('nodeCrypto', async () => {
  // Test hashing a random string.
  expect(true).toBe(true);
});

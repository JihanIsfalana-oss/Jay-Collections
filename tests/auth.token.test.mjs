import { describe, it, expect } from 'vitest';
import { buildUserTokenPayload } from '../src/utils/authToken.js';

describe('buildUserTokenPayload', () => {
  it('includes email and profile fields', () => {
    const payload = buildUserTokenPayload({
      id: 'user-123',
      username: 'jane',
      email: 'jane@example.com',
      nama_lengkap: 'Jane Doe',
    });

    expect(payload.id).toBe('user-123');
    expect(payload.username).toBe('jane');
    expect(payload.email).toBe('jane@example.com');
    expect(payload.role).toBe('user');
    expect(payload.nama_lengkap).toBe('Jane Doe');
  });
});

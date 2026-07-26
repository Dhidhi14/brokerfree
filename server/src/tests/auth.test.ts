import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { User } from '@/models/user.model';
import * as authService from '@/services/auth.service';
import { AppError } from '@/utils/app-error';
import { TEST_PASSWORD } from '@/tests/helpers';

describe('auth.service', () => {
  const registerPayload = {
    email: 'tenant@example.com',
    phone: '9876543210',
    password: TEST_PASSWORD,
    fullName: 'Riya Sharma',
    role: 'tenant' as const,
  };

  it('registers a user and stores a hashed password, not plaintext', async () => {
    const result = await authService.register(registerPayload);

    const stored = await User.findById(result.user._id).select('+passwordHash');
    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).toBeDefined();
    expect(stored!.passwordHash).not.toBe(TEST_PASSWORD);
    expect(stored!.passwordHash.startsWith('$2')).toBe(true);

    const lean = stored!.toObject() as unknown as Record<string, unknown>;
    expect(lean.password).toBeUndefined();
  });

  it('logs in with the correct password and returns a valid JWT', async () => {
    await authService.register(registerPayload);

    const result = await authService.login({
      email: registerPayload.email,
      password: TEST_PASSWORD,
    });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));

    const decoded = jwt.verify(result.accessToken, env.JWT_SECRET) as {
      userId: string;
      role: string;
    };
    expect(decoded.userId).toBe(result.user._id.toString());
    expect(decoded.role).toBe('tenant');
  });

  it('rejects login with the wrong password', async () => {
    await authService.register(registerPayload);

    await expect(
      authService.login({
        email: registerPayload.email,
        password: 'WrongPass1',
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'INVALID_CREDENTIALS',
    } satisfies Partial<AppError>);
  });

  it('embeds the correct role and userId in the JWT payload', async () => {
    const registered = await authService.register({
      ...registerPayload,
      email: 'owner@example.com',
      phone: '9876543211',
      role: 'owner',
    });

    const payload = jwt.verify(registered.accessToken, env.JWT_SECRET) as {
      userId: string;
      role: string;
    };

    expect(payload.userId).toBe(registered.user._id.toString());
    expect(payload.role).toBe('owner');
  });

  it('rejects duplicate email registration with a clear error', async () => {
    await authService.register(registerPayload);

    await expect(
      authService.register({
        ...registerPayload,
        phone: '9123456780',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'USER_EXISTS',
    } satisfies Partial<AppError>);
  });
});

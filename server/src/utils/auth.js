import jwt from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'examprep_token';
export const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Shared cookie settings keep login, logout and authentication consistent. */
export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
});

export const getClearCookieOptions = () => {
  const { maxAge: _maxAge, ...options } = getAuthCookieOptions();
  return options;
};

/** Create a signed JWT containing only the user's database identifier. */
export const createAuthToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: AUTH_TOKEN_TTL_SECONDS,
  });
};

export { validateLoginInput, validateRegistrationInput } from './authValidation.js';

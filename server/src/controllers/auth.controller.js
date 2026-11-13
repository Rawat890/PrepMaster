import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions,
  getClearCookieOptions,
  validateLoginInput,
  validateRegistrationInput,
} from '../utils/auth.js';

const sendUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

/** Register a new account and immediately authenticate it. */
export const register = async (req, res) => {
  const validation = validateRegistrationInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ success: false, message: 'Please correct the highlighted fields.', errors: validation.errors });
  }

  const { name, email, password } = validation.values;
  const existingUser = await User.findOne({ email }).select('_id');
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  try {
    const user = await User.create({ name, email, password });
    const token = createAuthToken(user._id);
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Your account has been created successfully.',
      user: sendUser(user),
    });
  } catch (error) {
    // A concurrent registration can pass the lookup above; the unique index handles that race.
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    throw error;
  }
};

/** Authenticate credentials without revealing whether an email exists. */
export const login = async (req, res) => {
  const validation = validateLoginInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ success: false, message: 'Enter a valid email and password.', errors: validation.errors });
  }

  const { email, password } = validation.values;
  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = user ? await user.comparePassword(password) : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = createAuthToken(user._id);
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return res.status(200).json({ success: true, message: 'Login successful.', user: sendUser(user) });
};

/** Clear the browser cookie; JWTs are stateless and expire naturally. */
export const logout = (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
  return res.status(200).json({ success: true, message: 'You have been logged out.' });
};

/** Return the current account. The protect middleware has already verified the JWT. */
export const getCurrentUser = async (req, res) => {
  return res.status(200).json({ success: true, user: sendUser(req.user) });
};

/** Cookie-based JWT guard used by private API routes. */
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'The account for this session no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
      return res.status(401).json({ success: false, message: 'Your session is invalid or has expired. Please log in again.' });
    }
    return next(error);
  }
};

/** Normalize and validate registration fields before querying MongoDB. */
export const validateRegistrationInput = ({ name, email, password } = {}) => {
  const errors = {};
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const passwordByteLength = typeof password === 'string' ? Buffer.byteLength(password, 'utf8') : 0;

  if (normalizedName.length < 2 || normalizedName.length > 60) {
    errors.name = 'Name must be between 2 and 60 characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    errors.email = 'Enter a valid email address.';
  }
  // bcrypt only uses the first 72 bytes, so reject longer UTF-8 passwords explicitly.
  if (typeof password !== 'string' || password.length < 8 || passwordByteLength > 72) {
    errors.password = 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.';
  }

  return { isValid: Object.keys(errors).length === 0, errors, values: { name: normalizedName, email: normalizedEmail, password } };
};

/** Validate login fields without revealing whether an account exists. */
export const validateLoginInput = ({ email, password } = {}) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const passwordByteLength = typeof password === 'string' ? Buffer.byteLength(password, 'utf8') : 0;
  const errors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) errors.email = 'Enter a valid email address.';
  if (typeof password !== 'string' || password.length === 0 || passwordByteLength > 72) errors.password = 'Password is required.';

  return { isValid: Object.keys(errors).length === 0, errors, values: { email: normalizedEmail, password } };
};

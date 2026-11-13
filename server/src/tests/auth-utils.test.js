import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLoginInput, validateRegistrationInput } from '../utils/authValidation.js';

test('registration validation trims name and normalizes email', () => {
  const result = validateRegistrationInput({ name: '  Rohan Rawat ', email: ' ROHAN@example.com ', password: 'strongpass1' });
  assert.equal(result.isValid, true);
  assert.equal(result.values.name, 'Rohan Rawat');
  assert.equal(result.values.email, 'rohan@example.com');
});

test('registration validation rejects short names, invalid emails and weak passwords', () => {
  const result = validateRegistrationInput({ name: 'R', email: 'not-an-email', password: '123' });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
  assert.ok(result.errors.password);
});

test('login validation normalizes email and requires a password', () => {
  const valid = validateLoginInput({ email: ' USER@example.com ', password: 'password123' });
  assert.equal(valid.isValid, true);
  assert.equal(valid.values.email, 'user@example.com');

  const invalid = validateLoginInput({ email: 'bad-email', password: '' });
  assert.equal(invalid.isValid, false);
});

test('registration validation rejects passwords that exceed bcrypt UTF-8 byte limit', () => {
  const result = validateRegistrationInput({ name: 'Rohan', email: 'rohan@example.com', password: 'é'.repeat(40) });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.password);
});

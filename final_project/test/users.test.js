const test = require('node:test');
const assert = require('node:assert/strict');
const users = require('../router/users');
test('reject invalid credentials', () => {
  assert.equal(users.credentials({ username:'a',password:'short' }),null);
  assert.equal(users.credentials({ username:{},password:'password123' }),null);
});
test('concurrent duplicate registration has one winner and correct password', async () => {
  const results = await Promise.all([users.register('alice','password123'),users.register('alice','password123')]);
  assert.equal(results.filter(Boolean).length,1);
  assert.equal(await users.authenticate('alice','password123'),true);
  assert.equal(await users.authenticate('alice','wrongpassword'),false);
  assert.equal(await users.authenticate('missing','password123'),false);
});

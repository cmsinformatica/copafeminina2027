import test from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

test('Express app is loaded and has correct setup', (t) => {
  assert.ok(app.listen, 'app deve ser uma função instanciada do Express');
});

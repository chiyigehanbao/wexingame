import test from 'node:test';
import assert from 'node:assert/strict';
import { followGrab } from '../js/core/tween.js';

test('grabbing a card mid-return keeps its place', () => {
  assert.equal(followGrab(0, 200, 240), 40);
  assert.equal(followGrab(80, 200, 210), 90);
  assert.equal(followGrab(6, 400, 400, 0.25), 6);
  assert.equal(followGrab(6, 400, 440, 0.25), 16);
});

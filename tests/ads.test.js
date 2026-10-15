import test from 'node:test';
import assert from 'node:assert/strict';
import { adsReady, maybeInterstitial, showRewarded } from '../js/core/ads.js';

test('ads stay off until an ad unit id is filled in', async () => {
  assert.equal(adsReady(), false);
  assert.equal(await showRewarded(), false);
  assert.equal(await maybeInterstitial(4, false), false);
  assert.equal(await maybeInterstitial(4, true), false);
});

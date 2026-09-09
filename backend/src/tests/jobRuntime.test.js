'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');

const cronPath = require.resolve('node-cron');
const runtimePath = require.resolve('../services/jobRuntime');
const previousCron = require.cache[cronPath];
const previousRuntime = require.cache[runtimePath];
let callback;
let stopped = false;

require.cache[cronPath] = {
  id: cronPath,
  filename: cronPath,
  loaded: true,
  exports: {
    schedule(expression, next) {
      assert.strictEqual(expression, '* * * * *');
      callback = next;
      return { stop() { stopped = true; } };
    },
  },
};
delete require.cache[runtimePath];
const runtime = require('../services/jobRuntime');
if (previousCron) require.cache[cronPath] = previousCron; else delete require.cache[cronPath];
if (previousRuntime) require.cache[runtimePath] = previousRuntime; else delete require.cache[runtimePath];

describe('job runtime shutdown', () => {
  it('stops new schedules and waits for active executions', async () => {
    runtime.resetJobRuntimeForTests();
    stopped = false;
    let release;
    let executions = 0;
    const pending = new Promise((resolve) => { release = resolve; });
    runtime.scheduleTracked('* * * * *', async () => {
      executions += 1;
      await pending;
    });

    const running = callback();
    await Promise.resolve();
    let finished = false;
    const draining = runtime.stopSchedulingAndDrain(1000).then((result) => {
      finished = true;
      return result;
    });
    await Promise.resolve();
    assert.strictEqual(stopped, true);
    assert.strictEqual(finished, false);
    await callback();
    assert.strictEqual(executions, 1);

    release();
    await running;
    assert.deepStrictEqual(await draining, { drained: true, active: 0 });
  });

  it('reports a bounded timeout while a task remains active', async () => {
    runtime.resetJobRuntimeForTests();
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    runtime.scheduleTracked('* * * * *', () => pending);
    const running = callback();
    await Promise.resolve();
    assert.deepStrictEqual(await runtime.stopSchedulingAndDrain(5), { drained: false, active: 1 });
    release();
    await running;
  });
});

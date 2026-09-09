'use strict';

const cron = require('node-cron');

const scheduledTasks = new Set();
const activeExecutions = new Set();
let acceptingExecutions = true;

function scheduleTracked(expression, callback, options) {
  const task = cron.schedule(expression, async (...args) => {
    if (!acceptingExecutions) return;
    const execution = Promise.resolve().then(() => callback(...args));
    activeExecutions.add(execution);
    try {
      return await execution;
    } finally {
      activeExecutions.delete(execution);
    }
  }, options);
  scheduledTasks.add(task);
  return task;
}

async function stopSchedulingAndDrain(timeoutMs = 60_000) {
  acceptingExecutions = false;
  for (const task of scheduledTasks) task.stop();

  const settled = Promise.allSettled([...activeExecutions]).then(() => true);
  let timeout;
  const expired = new Promise((resolve) => {
    timeout = setTimeout(() => resolve(false), timeoutMs);
  });
  const drained = await Promise.race([settled, expired]);
  clearTimeout(timeout);
  return { drained, active: activeExecutions.size };
}

function resetJobRuntimeForTests() {
  scheduledTasks.clear();
  activeExecutions.clear();
  acceptingExecutions = true;
}

module.exports = {
  resetJobRuntimeForTests,
  scheduleTracked,
  stopSchedulingAndDrain,
};

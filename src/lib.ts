// Create a higher-order function which takes a partial of the options
// and returns a function which takes a function as an argument.
// The function passed to the returned function will be called using a setInterval provided by the options.

import { OptionsChunk, OptionsInterval } from './types';

export const createPacktr = (options: OptionsInterval | OptionsChunk) => {
  if (['interval', 'chunk'].indexOf(options.executionMethod) === -1) {
    throw new Error('Invalid execution method');
  }

  if (['loose', 'strict'].indexOf(options.executionType) === -1) {
    throw new Error('Invalid execution type');
  }

  // Provide some defaults
  options.waitForAll = options.waitForAll ?? true;
  options.expectFullfillment = options.expectFullfillment ?? false;

  if (options.executionMethod === 'interval') {
    options.debounce = options.debounce ?? false;
  }

  const currentBatch: (() => Promise<unknown>)[] = [];

  let isExecuting = false;

  const queue: (() => Promise<unknown>)[] = [];

  let internalInterval: NodeJS.Timeout | null = null;

  async function executeBatch() {
    if (isExecuting) {
      return;
    }
    isExecuting = true;
    const result: Array<any> = [];

    if (options.executionType === 'strict') {
      // Execute the batch in order.
      for (let i = 0; i < currentBatch.length; i++) {
        try {
          result.push(await currentBatch[i]());
        } catch (error: unknown) {
          if (options.onCatch) {
            options.onCatch(error);
          } else {
            throw error;
          }
        }
      }
    } else if (options.executionType === 'loose') {
      for (let i = 0; i < currentBatch.length; i++) {
        result.push(
          currentBatch[i]().catch((error: unknown) => {
            if (options.onCatch) {
              options.onCatch(error);
            } else {
              throw error;
            }
          })
        );
      }
    }
    currentBatch.length = 0;
    if (options.onBatchExecute) {
      options.onBatchExecute(result);
    }

    if (options.waitForAll === true) {
      Promise.all(result)[
        options.expectFullfillment === true ? 'all' : 'finally'
      ](() => {
        isExecuting = false;
        fillBatchFromQueueAndExecute();
      });
    } else {
      isExecuting = false;
      fillBatchFromQueueAndExecute();
    }
    return result;
  }

  function addToQueue(queue: (() => void)[], fn: () => void) {
    queue.push(fn);
    if (!isExecuting) {
      fillBatchFromQueueAndExecute();
    }
  }

  function fillBatchFromQueueAndExecute() {
    fillBatchFromQueue();
    if (shouldBatchBeExecuted()) executeBatch();
  }

  function fillBatchFromQueue() {
    if (queue.length === 0) {
      return;
    }
    if (options.executionMethod === 'interval') {
      // Move all the items from the queue to the current batch.
      currentBatch.push(...queue);
      queue.length = 0;
      return;
    } else if (options.executionMethod === 'chunk') {
      options = options as OptionsChunk;
      const itemsToMove = Math.min(
        queue.length,
        options.chunkSize - currentBatch.length
      );
      currentBatch.push(...queue.splice(0, itemsToMove));
      return;
    }
  }

  function shouldBatchBeExecuted() {
    if (options.executionMethod === 'interval') {
      return false;
    } else if (options.executionMethod === 'chunk') {
      options = options as OptionsChunk;
      return currentBatch.length >= options.chunkSize;
    }
  }

  function launchInterval() {
    if (options.executionMethod === 'interval') {
      options = options as OptionsInterval;
      internalInterval = setInterval(() => {
        if (currentBatch.length > 0) {
          executeBatch();
        }
      }, options.interval);
      internalInterval.unref();
    }
  }

  function stopInterval() {
    if (internalInterval) {
      clearInterval(internalInterval);
    }
  }

  function relaunchInterval() {
    stopInterval();
    launchInterval();
  }

  function batcher(fn: () => Promise<unknown>) {
    addToQueue(queue, fn);
    if (options.executionMethod === 'interval')
      options.debounce && relaunchInterval();
  }

  launchInterval();

  return batcher;
};

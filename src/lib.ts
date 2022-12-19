// Create a higher-order function which takes a partial of the options
// and returns a function which takes a function as an argument.
// The function passed to the returned function will be called using a setInterval provided by the options.

import {
  OptionsChunk,
  OptionsInterval,
  Pack,
  Queue,
  QueueableFunction
} from './types';

export const createPacker = (options: OptionsInterval | OptionsChunk) => {
  // Validation
  if (['interval', 'chunk'].indexOf(options.executionMethod) === -1) {
    throw new Error('Invalid execution method');
  }

  if (['loose', 'strict'].indexOf(options.executionType) === -1) {
    throw new Error('Invalid execution type');
  }

  if (options.executionMethod === 'interval') {
    if (
      typeof options.interval !== 'number' ||
      isNaN(options.interval) ||
      options.interval <= 0
    ) {
      throw new Error('Invalid interval');
    }
  }

  if (options.executionMethod === 'chunk') {
    if (
      typeof options.chunkSize !== 'number' ||
      isNaN(options.chunkSize) ||
      options.chunkSize <= 0
    ) {
      throw new Error('Invalid chunk size');
    }
  }

  if (!options.awaitAllTasks && options.expectResolutions) {
    throw new Error('Cannot expect resolutions when not awaiting all tasks');
  }

  // Defaults
  options.awaitAllTasks = options.awaitAllTasks ?? true;
  options.expectResolutions = options.expectResolutions ?? false;

  if (options.executionMethod === 'interval') {
    options.debounce = options.debounce ?? false;
    options.unref = options.unref ?? false;
  }

  if (options.executionMethod === 'chunk') {
    options.maxChunkLifetime = options.maxChunkLifetime ?? 600000;
  }

  // Internal state
  const queue: Queue = [];
  const pack: Pack = [];

  let isPackExecuting = false;
  let internalInterval: NodeJS.Timeout | null = null;

  // Internal API
  async function executePack() {
    if (isPackExecuting) {
      return;
    }
    isPackExecuting = true;
    const result: Array<Promise<unknown> | unknown> = [];

    if (options.executionType === 'strict') {
      // Execute the batch in order.
      for (let i = 0; i < pack.length; i++) {
        try {
          result.push(await pack[i]());
        } catch (error: unknown) {
          manageErrorCatching(error);
        }
      }
    } else if (options.executionType === 'loose') {
      for (let i = 0; i < pack.length; i++) {
        // Check if pack[i] is a promise, if it is catch it, if it is not wrap it in a try-catch
        if (isPromise(pack[i])) {
          result.push(
            (pack[i]() as Promise<unknown>).catch((error: unknown) => {
              manageErrorCatching(error);
            })
          );
        } else {
          try {
            result.push(pack[i]());
          } catch (error: unknown) {
            manageErrorCatching(error);
          }
        }
      }
    }
    pack.length = 0;
    if (options.onPackExecution) {
      options.onPackExecution(result);
    }

    if (options.awaitAllTasks === true) {
      Promise.all(result)[
        options.expectResolutions === true ? 'then' : 'finally'
      ](() => {
        isPackExecuting = false;
        fillPackFromQueueAndExecute();
      });
    } else {
      isPackExecuting = false;
      fillPackFromQueueAndExecute();
    }
    return result;
  }

  function manageErrorCatching(error: unknown) {
    if (options.onCatch) {
      options.onCatch(error);
    } else {
      throw error;
    }
  }

  function addToQueue(queue: (() => void)[], fn: () => void) {
    queue.push(fn);
    if (!isPackExecuting) {
      fillPackFromQueueAndExecute();
    }
  }

  function fillPackFromQueueAndExecute() {
    fillPackFromQueue();
    if (shouldPackBeExecuted()) executePack();
  }

  function fillPackFromQueue() {
    if (queue.length === 0) {
      return;
    }
    if (options.executionMethod === 'interval') {
      // Move all the items from the queue to the current batch.
      pack.push(...queue);
      queue.length = 0;
      return;
    } else if (options.executionMethod === 'chunk') {
      options = options as OptionsChunk;
      const itemsToMove = Math.min(
        queue.length,
        options.chunkSize - pack.length
      );
      pack.push(...queue.splice(0, itemsToMove));
      return;
    }
  }

  function shouldPackBeExecuted() {
    if (isPackExecuting) return false;
    if (options.executionMethod === 'interval') {
      return false;
    } else if (options.executionMethod === 'chunk') {
      options = options as OptionsChunk;
      return pack.length >= options.chunkSize;
    }
  }

  function launchInterval() {
    if (options.executionMethod === 'interval') {
      options = options as OptionsInterval;
      internalInterval = setInterval(() => {
        if (pack.length > 0) {
          executePack();
        }
      }, options.interval);
      options.unref && internalInterval.unref();
    } else if (options.executionMethod === 'chunk') {
      options = options as OptionsChunk;
      internalInterval = setInterval(() => {
        if (pack.length > 0) {
          executePack();
        }
      }, options.maxChunkLifetime);
      options.unref && internalInterval.unref();
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

  // Public API
  function handler(fn: QueueableFunction, ...args: unknown[]) {
    addToQueue(queue, () => fn(...args));
    if (options.executionMethod === 'interval')
      options.debounce && relaunchInterval();
    else if (options.executionMethod === 'chunk') relaunchInterval();
  }

  launchInterval();

  return handler;
};

function isPromise(obj) {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

# What is it?

This is a zero-dependency and low-footprint library that allows you to pack a set of asynchronous tasks and execute them in a controlled way.  
It allows you to execute those tasks in time-based intervals or in size-based chunks.  
The library also allows you to indicate the order of execution of the packeted tasks (`strict` or `loose`).  
It provides many other configurations you can leverage to better control the flow of the pack.

# How do I install it?

You can install it by using the following command:

```bash
npm install async-task-packer
```

# How can I use it?

Create a packer by calling the `createPacker` function and pass it the configuration you want to use.  
Then, wrap your async functions with the resulting function to add them to the pack.

## Use-case #1 - Delayed logger

In this scenario, we want to send a log to an external API.  
We want to pack the logs in a time-based interval of 1 second, but we don't care about the order of the logs (`loose` type) as we provide a `createdAt` timestamp in the log payload and we can sort the logs on the server side.

```javascript
const packer = createPacker({
  executionMethod: 'interval',
  executionType: 'loose',
  interval: 1000
});

const logger = (message) => {
  const createdAt = new Date();
  packer(() => {
    sendLogToAnExternalApi(message, createdAt);
  });
};

logger('Hello');
logger('World');
```

## Use-case #2 - Analytics chunk-based packer

In this scenario, we want to send a batch of events to an external API.  
We want to send the events in chunks of 10, but we also want to send the events after 10 seconds, even if the chunk is not full, to prevent losing important information.  
We don't care about event ordering (`loose` type) as we provide a `createdAt` timestamp in the event payload and we can sort the events on the server side.
  
  ```javascript
  const packer = createPacker({
    executionMethod: 'chunk',
    executionType: 'loose',
    chunkSize: 10,
    maxChunkLifetime: 10*1000 // Using a debounce mechanism, the packer will execute the pack after 10 seconds, even if it's not full
  });

  const track = (event, ...args) => {
    const createdAt = new Date();
    packer(() => {
      sendEventToAnExternalApi(event, createdAt, ...args);
    });
  };

  track('user_login', { userId: 123 });
  track('item_added_to_cart', { cartUUID: 'abc', itemId: 456 });
  track('item_added_to_cart', { cartUUID: 'abc', itemId: 789 });
  track('order_completed', { cartUUID: 'abc' });
  track('user_logout', { userId: 123 });
```



## Example #1 - Chunk Method, Strict Type

```javascript
const packer = createPacker({
  executionMethod: 'chunk',
  executionType: 'strict', // Enforcing execution order
  chunkSize: 3
});

const task1 = async () => {
  console.log('task1');
  return 'task1';
};

const task2 = async () => {
  console.log('task2');
  return 'task2';
};

const task3 = async () => {
  console.log('task3');
  return 'task3';
};

packer(task1);
packer(task2);
packer(task3);
```

The output will be:

```bash
task1
task2
task3
```

## Example #2 - Chunk Method, Loose Type

```javascript
const packer = createPacker({
  executionMethod: 'chunk',
  executionType: 'loose', // Not enforcing execution order
  chunkSize: 2
});

const task1 = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('task1');
      resolve('task1');
    }, 3000);
  });
};

const task2 = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('task2');
      resolve('task2');
    }, 2000);
  });
};

const task3 = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('task3');
      resolve('task3');
    }, 1000);
  });
};

const task4 = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('task4');
      resolve('task4');
    }, 0);
  });
};

packer(task1);
packer(task2);
packer(task3);
packer(task4);
```

The output will be:

```bash
task2
task1
# This task and the next one will be executed later because, even if their timeouts are shorter, the packer has a chunk size of 2 and had to complete the previous pack before executing the next one.
task4
task3
```

## Example #3 - Interval Method, Strict Type

```javascript
const packer = createPacker({
  executionMethod: 'interval',
  executionType: 'strict', // Enforcing execution order
  interval: 1000
});

const task1 = async () => {
  console.log('task1');
  return 'task1';
};

const task2 = async () => {
  console.log('task2');
  return 'task2';
};

const task3 = async () => {
  console.log('task3');
  return 'task3';
};

packer(task1);
packer(task2);
packer(task3);
```

The output will be:

```bash
# 1000ms later
task1
task2
task3
```

## Example #4 - Interval Method, Loose Type

```javascript
const packer = createPacker({
  executionMethod: 'interval',
  executionType: 'loose', // Not enforcing execution order
  interval: 100
});

for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    packer(
      () =>
        new Promise((resolve) => {
          console.log(i);
          resolve(i);
        })
    );
  }, Math.floor(Math.random() * 1000));
}
```

The output will be:

```bash
3
2
5
0
9
4
1
6
7
8
```

Of course, results will vary every time you run it because of the random timeouts.

# API

The `createPacker` function accepts an object with the following properties:

- `executionMethod` (_required_): The execution method to use. It can be either `chunk` or `interval`.
  - If you choose `chunk` as the execution method, you can also provide the following properties:
    - `chunkSize` (_required_): The size of the chunk to use. It must be a positive integer.
    - `maxChunkLifetime` (_optional_): The maximum lifetime of a chunk. It must be a positive integer. Defaults to `600000` (10 minutes).
    - `unref` (_optional_): A boolean indicating whether the interval should be unrefed or not. Defaults to `false`. (https://nodejs.org/api/timers.html#timers_timeout_unref)
  - If you choose `interval` as the execution method, you can also provide the following properties:
    - `interval` (_required_): The interval to use. It must be a positive integer.
    - `debounce` (_optional_): A boolean indicating whether the interval should be debounced or not. Defaults to `false`. Setting it to `true` will cause the interval to be reset every time a new task is added to the pack.
    - `unref` (_optional_): A boolean indicating whether the interval should be unrefed or not. Defaults to `false`. (https://nodejs.org/api/timers.html#timers_timeout_unref)
- `executionType` (_required_): The execution type to use. It can be either `strict` or `loose`.
  - If you choose `strict` as the execution type, the packer will execute the tasks in the order they were added to the pack.
  - If you choose `loose` as the execution type, the packer will execute the tasks in parallel and will not enforce the order they were added to the pack.

To better control the pack flow, you can also pass the following properties:

- `expectResolutions` (_optional_): A boolean indicating whether the packer should expect the tasks to be resolved or not. Defaults to `false`.
  - If set to `false`, the packer will consider the pack as resolved as soon as the tasks are completed, regardless of whether they are resolved or rejected. Setting this option to false still allows you to catch errors by providing an `onCatch` method.
  - If set to `true`, the packer will consider the pack as resolved only if all the tasks are resolved. If one of the tasks is rejected, the packer will consider the pack as rejected and will call the packer `onCatch` method if provided or will throw the error if no `onCatch` method is provided.
- `awaitAllTasks` (_optional_): A boolean indicating whether the packer should wait for all the tasks to be executed before resolving the pack. Defaults to `false`.
  - If set to `false`, the packer will resolve the pack as soon as the tasks are executed.
  - If set to `true`, the packer will wait for all the tasks to be executed before resolving the pack.  
    _Please note that this option will immediately fill the pack with the tasks currently in the queue if conditions are met. It means a new pack could potentially be created and executed even if the previous one is not yet resolved._
- `onCatch`: A function to be called when an error is thrown. It will be called with the error as the first argument. If not provided, the error will be thrown instead.
- `onPackExecution`: A function to be called when a pack is executed. It will be called with the array of executed tasks (Promises yet to be resolved or rejected) as the first argument.

The packer function accepts an async function as its first argument. You can pass the function parameters as the following arguments (It wraps the given function in an anonymous function that accepts the parameters and returns the function call).
# Tests

You can run the tests by using the following command:

```bash
npm test
```

# How does it work?

## Glossary

### `task`

An async function to execute.

### `pack`

The pack is the current list of async tasks to be / being executed.

### `queue`

A temporary queue used to store every async task provided.

## Execution Steps

The library exposes a higher-order function that you can wrap your async functions with to put them in a temporary queue.  
The library will then move items from the queue to the `pack` based on the provided execution method (size limited for `chunk` configuration or time-based for `interval` configuration).  
The library will execute the tasks in the queue according to the configuration that you pass to it.

# ToDo

- [ ] Tests - Better coverage.

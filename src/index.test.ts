import { createPacktr } from './index';

const createPromise = (timeout: number, counter: number) => {
  return () => {
    const internalCounter = counter++;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(internalCounter);
      }, timeout);
    });
  };
};

const ENOUGH_TIME = new Promise((resolve) => setTimeout(resolve, 950));

it('should return the correct batch responses in chunk-strict configuration', async () => {
  const expects = [
    [1, 2, 3],
    [4, 5, 6]
  ];
  const myPacktr = createPacktr({
    executionMethod: 'chunk',
    executionType: 'strict',
    chunkSize: 3,
    onBatchExecute: (result) => {
      Promise.all(result).then((r) => {
        expect(r).toEqual(expects.shift());
      });
    }
  });

  const promises = Array.from({ length: 6 }, (_, i) =>
    createPromise(i * 10, i + 1)
  );

  promises.forEach((promise) => myPacktr(promise));
  await ENOUGH_TIME;
});

it('should return the correct batch responses in chunk-loose configuration', async () => {
  const expects = [
    [3, 2, 1],
    [6, 5, 4]
  ];
  const myPacktr = createPacktr({
    executionMethod: 'chunk',
    executionType: 'loose',
    chunkSize: 3,
    onBatchExecute: (result) => {
      const looseResponse: any[] = [];
      for (const r of result) {
        r.then((res) => {
          looseResponse.push(res);
        });
      }
      Promise.all(result).then(() => {
        expect(looseResponse).toEqual(expects.shift());
      });
    }
  });

  const promises = Array.from({ length: 6 }, (_, i) => {
    return createPromise(70 - i * 10, i + 1);
  });

  promises.forEach((promise) => myPacktr(promise));
  await ENOUGH_TIME;
});

it('should return the correct batch responses in interval-strict configuration', async () => {
  const expects = [[1, 2, 3, 4, 5, 6]];
  const myPacktr = createPacktr({
    executionMethod: 'interval',
    executionType: 'strict',
    interval: 100,
    onBatchExecute: (result) => {
      Promise.all(result).then((r) => {
        expect(r).toEqual(expects.shift());
      });
    }
  });

  const promises = Array.from({ length: 6 }, (_, i) =>
    createPromise(i * 10, i + 1)
  );

  promises.forEach((promise) => myPacktr(promise));
  await ENOUGH_TIME;
});

it('should return the correct batch responses in interval-loose configuration', async () => {
  const expects = [[6, 5, 4, 3, 2, 1]];
  const myPacktr = createPacktr({
    executionMethod: 'interval',
    executionType: 'loose',
    interval: 100,
    onBatchExecute: (result) => {
      const looseResponse: any[] = [];
      for (const r of result) {
        r.then((res) => {
          looseResponse.push(res);
        });
      }
      Promise.all(result).then(() => {
        expect(looseResponse).toEqual(expects.shift());
      });
    }
  });

  const promises = Array.from({ length: 6 }, (_, i) => {
    return createPromise(70 - i * 10, i + 1);
  });

  promises.forEach((promise) => myPacktr(promise));
  await ENOUGH_TIME;
});

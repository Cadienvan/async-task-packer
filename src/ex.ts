import { createPacktr } from './lib';

let counter = 1;
const createPromise = (timeout: number) => {
  return () => {
    const internalCounter = counter++;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(internalCounter);
      }, timeout);
    });
  };
};

const ENOUGH_TIME = new Promise((resolve) => setTimeout(resolve, 1500));
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
      console.log(looseResponse);
      console.log(result);
    });
  }
});

const promises = Array.from({ length: 6 }, (_, i) => {
  return createPromise(70 - i * 10);
});

promises.forEach((promise) => myPacktr(promise));
(async () => {
  await ENOUGH_TIME;
})();

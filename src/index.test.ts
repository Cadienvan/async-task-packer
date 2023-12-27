import { createPacker } from './index';

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

const createRejectablePromise = (timeout: number, counter: number) => {
  return () => {
    const internalCounter = counter++;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(internalCounter);
      }, timeout);
    });
  };
};

const ENOUGH_TIME = new Promise((resolve) => setTimeout(resolve, 950));

describe('functional tests', () => {
  it('should return the correct batch responses in chunk-strict configuration', async () => {
    const expects = [
      [1, 2, 3],
      [4, 5, 6]
    ];
    const myPacktr = createPacker({
      executionMethod: 'chunk',
      executionType: 'strict',
      chunkSize: 3,
      unref: true,
      onPackExecution: (result) => {
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
    const myPacktr = createPacker({
      executionMethod: 'chunk',
      executionType: 'loose',
      chunkSize: 3,
      unref: true,
      onPackExecution: (result) => {
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
    const myPacktr = createPacker({
      executionMethod: 'interval',
      executionType: 'strict',
      interval: 100,
      unref: true,
      onPackExecution: (result) => {
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
    const myPacktr = createPacker({
      executionMethod: 'interval',
      executionType: 'loose',
      interval: 100,
      unref: true,
      onPackExecution: (result) => {
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

  it('should return the correct batch responses in interval-strict configuration with awaitAllTasks', async () => {
    const expects = [[1, 2, 3, 4, 5, 6]];
    const myPacktr = createPacker({
      executionMethod: 'interval',
      executionType: 'strict',
      interval: 100,
      awaitAllTasks: true,
      unref: true,
      onPackExecution: (result) => {
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

  it('should manage errors in strict mode', async () => {
    const myPacktr = createPacker({
      executionMethod: 'chunk',
      executionType: 'strict',
      chunkSize: 2,
      unref: true,
      onCatch: () => {
        expect(true).toBe(true);
      }
    });

    const promises = Array.from({ length: 6 }, (_, i) =>
      createRejectablePromise(i * 10, i + 1)
    );

    promises.forEach((promise) => myPacktr(promise));
    await ENOUGH_TIME;
  });
});

describe('throw error tests', () => {
  it('should throw error when executionMethod is not valid', () => {
    expect(() => {
      createPacker({
        executionMethod: 'invalid' as any,
        executionType: 'strict',
        chunkSize: 3
      });
    }).toThrow();
  });

  it('should throw error when executionType is not valid', () => {
    expect(() => {
      createPacker({
        executionMethod: 'chunk',
        executionType: 'invalid' as any,
        chunkSize: 3
      });
    }).toThrow();
  });

  it('should throw error when chunkSize is not valid', () => {
    expect(() => {
      createPacker({
        executionMethod: 'chunk',
        executionType: 'strict',
        chunkSize: 0
      });
    }).toThrow();
  });

  it('should throw error when interval is not valid', () => {
    expect(() => {
      createPacker({
        executionMethod: 'interval',
        executionType: 'strict',
        interval: 0,
        unref: true
      });
    }).toThrow();
  });

  it('should throw error when awaitAllTasks is false and expectResolutions is true', () => {
    expect(() => {
      createPacker({
        executionMethod: 'interval',
        executionType: 'strict',
        interval: 100,
        awaitAllTasks: false,
        expectResolutions: true,
        unref: true
      });
    }).toThrow();
  });
});

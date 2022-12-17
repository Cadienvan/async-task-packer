import { createPacker } from '.';

const packer = createPacker({
  executionMethod: 'interval',
  executionType: 'loose',
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

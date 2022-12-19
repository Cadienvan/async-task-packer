import { createPacker } from './lib';

const packer = createPacker({
  executionMethod: 'chunk',
  executionType: 'strict',
  chunkSize: 2
});

packer(console.log, 'a', 'b', 'c', 'd');
packer(() => console.log('a', 'b', 'c', 'd', 'e'));

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
})();

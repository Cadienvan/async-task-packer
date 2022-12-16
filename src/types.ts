type OptionsGeneric = {
  waitForAll?: boolean;
  expectFullfillment?: boolean;
  onBatchExecute?: (result: Array<any>) => void;
  onCatch?: (error: unknown) => void;
};

export type OptionsInterval = OptionsGeneric & {
  executionMethod: 'interval';
  executionType: 'loose' | 'strict';
  interval: number;
  debounce?: boolean;
};

export type OptionsChunk = OptionsGeneric & {
  executionMethod: 'chunk';
  executionType: 'loose' | 'strict';
  chunkSize: number;
};

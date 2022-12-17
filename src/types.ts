type OptionsGeneric = {
  awaitAllTasks?: boolean;
  expectResolutions?: boolean;
  onPackExecution?: (result: Array<any>) => void;
  onCatch?: (error: unknown) => void;
};

export type OptionsInterval = OptionsGeneric & {
  executionMethod: 'interval';
  executionType: 'loose' | 'strict';
  interval: number;
  debounce?: boolean;
  unref?: boolean;
};

export type OptionsChunk = OptionsGeneric & {
  executionMethod: 'chunk';
  executionType: 'loose' | 'strict';
  chunkSize: number;
};

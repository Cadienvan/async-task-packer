type OptionsGeneric = {
  awaitAllTasks?: boolean;
  expectResolutions?: boolean;
  unref?: boolean;
  onPackExecution?: (result: Array<any>) => void;
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
  maxChunkLifetime?: number;
};

export type QueueableFunction = (
  ...args: unknown[]
) => Promise<unknown> | unknown;
export type Queue = QueueableFunction[];
export type Pack = QueueableFunction[];

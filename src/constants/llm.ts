export const DEFAULT_TEMPERATURE = 0.1;
export const DEFAULT_MAX_TOKENS = 2000;
export const DEFAULT_MAX_ITERATIONS = 50;

export const THINKING_MODELS = [
  'mistralai/ministral-3-14b-reasoning',
  'ministral-3-14b-reasoning',
  'o1-preview',
  'o1-mini',
  'o1',
] as const;

export const DEFAULT_REASONING_EFFORT = 'high' as const;

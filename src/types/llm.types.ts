export interface ToolDefinition {
  readonly type: 'function';
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: {
      readonly type: 'object';
      readonly properties: Record<string, unknown>;
      readonly required: readonly string[];
    };
  };
}

export interface LLMChatOptions {
  readonly enableThinking?: boolean;
  readonly onThinkingUpdate?: (thinking: string) => void;
}

export type ToolChoice =
  | 'auto'
  | 'required'
  | 'none'
  | {
      readonly type: 'function';
      readonly function: { readonly name: string };
    };

import OpenAI from 'openai';
import { config } from './config.js';
import { logger } from './logger.js';
import type { ToolDefinition, LLMChatOptions, ToolChoice } from './types/llm.types.js';
import {
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  THINKING_MODELS,
  DEFAULT_REASONING_EFFORT,
} from './constants/llm.js';

export class LLMClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: config.llm.baseURL,
      apiKey: config.llm.apiKey,
    });
    logger.info(`LLM initialized: ${config.llm.baseURL} with model ${config.llm.model}`);
  }

  public async chat(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    tools?: ToolDefinition[],
    toolChoice?: ToolChoice,
    options?: LLMChatOptions
  ): Promise<OpenAI.Chat.ChatCompletion> {
    try {
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: config.llm.model!,
        messages,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
      };

      if (tools && tools.length > 0) {
        params.tools = tools as OpenAI.Chat.ChatCompletionTool[];
        params.tool_choice = toolChoice || 'auto';
      }

      if (options?.enableThinking) {
        const isThinkingModel = THINKING_MODELS.some(model => config.llm.model?.includes(model));

        if (isThinkingModel) {
          (params as any).reasoning_effort = DEFAULT_REASONING_EFFORT;
        }

        if (options.onThinkingUpdate) {
          return await this.chatWithThinkingStream(params, options.onThinkingUpdate);
        }
      }

      const response = await this.client.chat.completions.create(params);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`LLM error: ${errorMessage}`);
      throw error;
    }
  }

  private async chatWithThinkingStream(
    params: OpenAI.Chat.ChatCompletionCreateParams,
    onThinkingUpdate: (thinking: string) => void
  ): Promise<OpenAI.Chat.ChatCompletion> {
    try {
      const stream: any = await this.client.chat.completions.create({
        ...params,
        stream: true,
        stream_options: { include_usage: true },
      } as any);

      let fullContent = '';
      let thinkingContent = '';
      const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];
      let finishReason = '';
      let usage: OpenAI.CompletionUsage | undefined;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if ((delta as any)?.reasoning) {
          thinkingContent += (delta as any).reasoning;
          onThinkingUpdate(thinkingContent);
        }

        if (delta?.content) {
          fullContent += delta.content;
        }

        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index ?? 0;

            if (!toolCalls[index]) {
              toolCalls[index] = {
                id: toolCall.id ?? '',
                type: 'function' as const,
                function: { name: '', arguments: '' },
              };
            }

            if (toolCall.function?.name) {
              toolCalls[index].function.name = toolCall.function.name;
            }
            if (toolCall.function?.arguments) {
              toolCalls[index].function.arguments += toolCall.function.arguments;
            }
          }
        }

        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }

        if ((chunk as any).usage) {
          usage = (chunk as any).usage;
        }
      }

      const message: any = {
        role: 'assistant' as const,
        content: fullContent || null,
        refusal: null,
      };

      if (thinkingContent) {
        message.reasoning = thinkingContent;
      }

      if (toolCalls.length > 0) {
        message.tool_calls = toolCalls;
      }

      return {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion' as const,
        created: Math.floor(Date.now() / 1000),
        model: params.model,
        choices: [
          {
            index: 0,
            message,
            finish_reason: (finishReason ||
              'stop') as OpenAI.Chat.ChatCompletion.Choice['finish_reason'],
            logprobs: null,
          },
        ],
        usage: usage ?? {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      } as OpenAI.Chat.ChatCompletion;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`LLM thinking stream error: ${errorMessage}`);
      throw error;
    }
  }
}

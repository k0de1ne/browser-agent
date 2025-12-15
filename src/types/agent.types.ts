import type { TaskStepStatus, ActionStatus } from './common.types.js';

export interface AgentConfig {
  readonly requireConfirmation?: boolean;
  readonly maxIterations?: number;
  readonly enableThinking?: boolean;
  readonly showThinkingProcess?: boolean;
  readonly showPlanVisualization?: boolean;
  readonly showActionHistory?: boolean;
}

export interface TaskStep {
  readonly id: string;
  readonly description: string;
  status: TaskStepStatus;
  toolCalls?: readonly string[];
  result?: string;
  failureReason?: string;
  alternativeStrategies?: readonly string[];
}

export interface TaskPlan {
  readonly goal: string;
  readonly steps: TaskStep[];
  currentStepIndex: number;
  adaptations: readonly string[];
  completionCriteria: readonly string[];
}

export interface ActionHistoryItem {
  readonly iteration: number;
  readonly timestamp: Date;
  readonly tool: string;
  readonly args: Record<string, unknown>;
  readonly result: string;
  readonly status: ActionStatus;
}

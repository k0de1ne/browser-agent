export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ComputedStyles {
  readonly display?: string;
  readonly visibility?: string;
  readonly opacity?: string;
}

export interface ParentElementInfo {
  readonly tag: string;
  readonly text?: string;
  readonly attributes: Record<string, string>;
}

export interface SiblingElementInfo {
  readonly id: string;
  readonly tag: string;
  readonly text?: string;
}

export type ElementMatchType = 'exact' | 'context_before' | 'context_after';
export type TaskStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
export type ActionStatus = 'success' | 'failed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SecurityCategory =
  | 'financial'
  | 'data_loss'
  | 'privacy'
  | 'account'
  | 'content_modification';

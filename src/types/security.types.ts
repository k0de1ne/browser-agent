import type { RiskLevel, SecurityCategory } from './common.types.js';

export interface DestructiveActionContext {
  readonly action: string;
  readonly elementText?: string;
  readonly elementAttributes?: Record<string, string>;
  readonly pageUrl?: string;
  readonly pageTitle?: string;
  readonly semanticContext?: string;
}

export interface SecurityAssessment {
  readonly isDestructive: boolean;
  readonly riskLevel: RiskLevel;
  readonly reason: string;
  readonly category?: SecurityCategory;
}

export interface KeywordDictionary {
  readonly en: readonly string[];
  readonly ru: readonly string[];
  readonly es: readonly string[];
  readonly de: readonly string[];
  readonly fr: readonly string[];
}

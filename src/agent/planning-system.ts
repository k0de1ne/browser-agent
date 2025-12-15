import type { TaskPlan, TaskStep } from '../types/agent.types.js';

const ELEMENT_NOT_FOUND_STRATEGIES = [
  'Try text-based search instead of selector',
  'Check if element is below viewport (scroll down)',
  'Wait for dynamic content to load',
  'Read page structure to understand layout',
  'Try different CSS selectors',
  'Check if need to navigate to different section first',
] as const;

const MIN_FAILURES_TO_ASK_USER = 5;
const KEYWORDS_REQUIRING_USER_HELP = ['captcha', '2fa', 'verification'] as const;

export class PlanningUtils {
  public static elementNotFoundStrategies(): readonly string[] {
    return ELEMENT_NOT_FOUND_STRATEGIES;
  }

  public static shouldAskUser(failureCount: number, context: string): boolean {
    if (failureCount >= MIN_FAILURES_TO_ASK_USER) {
      return true;
    }

    const lowerContext = context.toLowerCase();
    return (
      KEYWORDS_REQUIRING_USER_HELP.some(keyword => lowerContext.includes(keyword)) ||
      (lowerContext.includes('login') && lowerContext.includes('required'))
    );
  }
}

export type { TaskPlan, TaskStep };

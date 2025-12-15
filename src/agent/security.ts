import type { DestructiveActionContext, SecurityAssessment } from '../types/security.types.js';
import type { RiskLevel, SecurityCategory } from '../types/common.types.js';
import {
  DESTRUCTIVE_KEYWORDS,
  SENSITIVE_URL_PATTERNS,
  SENSITIVE_FORM_INDICATORS,
  RISK_LEVEL_ORDER,
  RISK_EMOJI,
} from '../constants/security.js';

export class SecurityLayer {
  public static assessAction(context: DestructiveActionContext): SecurityAssessment {
    const assessments: SecurityAssessment[] = [];

    if (context.elementText) {
      const textAssessment = this.checkTextForDestructiveKeywords(context.elementText);
      if (textAssessment) {
        assessments.push(textAssessment);
      }
    }

    if (context.elementAttributes) {
      const attrAssessment = this.checkAttributesForDestructiveIndicators(
        context.elementAttributes
      );
      if (attrAssessment) {
        assessments.push(attrAssessment);
      }
    }

    if (context.pageUrl) {
      const urlAssessment = this.checkUrlForSensitivePatterns(context.pageUrl);
      if (urlAssessment) {
        assessments.push(urlAssessment);
      }
    }

    if (context.semanticContext) {
      const semanticAssessment = this.checkSemanticContext(context.semanticContext);
      if (semanticAssessment) {
        assessments.push(semanticAssessment);
      }
    }

    if (context.action === 'type_text') {
      const typeAssessment = this.assessTypeAction(context);
      if (typeAssessment) {
        assessments.push(typeAssessment);
      }
    }

    if (assessments.length === 0) {
      return {
        isDestructive: false,
        riskLevel: 'low',
        reason: 'No destructive patterns detected',
      };
    }

    assessments.sort((a, b) => RISK_LEVEL_ORDER[b.riskLevel] - RISK_LEVEL_ORDER[a.riskLevel]);

    return {
      ...assessments[0],
      isDestructive: true,
    };
  }

  private static checkTextForDestructiveKeywords(text: string): SecurityAssessment | null {
    const lowerText = text.toLowerCase();

    for (const [category, languages] of Object.entries(DESTRUCTIVE_KEYWORDS)) {
      for (const [lang, keywords] of Object.entries(languages)) {
        for (const keyword of keywords) {
          if (lowerText.includes(keyword)) {
            return {
              isDestructive: true,
              riskLevel: this.getRiskLevelForCategory(category as SecurityCategory),
              reason: `Detected ${category} keyword: "${keyword}" (${lang})`,
              category: category as SecurityCategory,
            };
          }
        }
      }
    }

    return null;
  }

  private static checkAttributesForDestructiveIndicators(
    attributes: Record<string, string>
  ): SecurityAssessment | null {
    const attrString = JSON.stringify(attributes).toLowerCase();

    if (attributes.type === 'submit' || attributes.role === 'button') {
      const indicators = [
        'delete',
        'remove',
        'buy',
        'purchase',
        'pay',
        'submit-payment',
        'checkout',
        'confirm-order',
      ];
      for (const indicator of indicators) {
        if (attrString.includes(indicator)) {
          return {
            isDestructive: true,
            riskLevel: 'high',
            reason: `Button/submit with destructive attribute pattern: ${indicator}`,
            category: 'content_modification',
          };
        }
      }
    }

    for (const indicator of SENSITIVE_FORM_INDICATORS) {
      if (attrString.includes(indicator)) {
        return {
          isDestructive: true,
          riskLevel: 'critical',
          reason: `Sensitive form field detected: ${indicator}`,
          category: 'financial',
        };
      }
    }

    return null;
  }

  private static checkUrlForSensitivePatterns(url: string): SecurityAssessment | null {
    for (const pattern of SENSITIVE_URL_PATTERNS) {
      if (pattern.test(url)) {
        return {
          isDestructive: true,
          riskLevel: 'medium',
          reason: `Operating in sensitive area: ${pattern.source}`,
          category: 'privacy',
        };
      }
    }

    return null;
  }

  private static checkSemanticContext(context: string): SecurityAssessment | null {
    const lowerContext = context.toLowerCase();

    const sensitiveContexts = [
      { pattern: 'checkout', category: 'financial' as const, risk: 'high' as const },
      { pattern: 'payment', category: 'financial' as const, risk: 'critical' as const },
      { pattern: 'cart', category: 'financial' as const, risk: 'low' as const },
      { pattern: 'billing', category: 'financial' as const, risk: 'high' as const },
      { pattern: 'delete', category: 'data_loss' as const, risk: 'high' as const },
      { pattern: 'settings', category: 'account' as const, risk: 'medium' as const },
    ];

    for (const { pattern, category, risk } of sensitiveContexts) {
      if (lowerContext.includes(pattern)) {
        return {
          isDestructive: true,
          riskLevel: risk,
          reason: `Action in sensitive context: ${pattern}`,
          category,
        };
      }
    }

    return null;
  }

  private static assessTypeAction(context: DestructiveActionContext): SecurityAssessment | null {
    const attrs = context.elementAttributes || {};
    const attrString = JSON.stringify(attrs).toLowerCase();

    if (attrs.type === 'password') {
      return {
        isDestructive: true,
        riskLevel: 'high',
        reason: 'Typing into password field',
        category: 'account',
      };
    }

    if (
      attrString.includes('card') ||
      attrString.includes('cvv') ||
      attrString.includes('credit')
    ) {
      return {
        isDestructive: true,
        riskLevel: 'critical',
        reason: 'Typing into payment information field',
        category: 'financial',
      };
    }

    return null;
  }

  private static getRiskLevelForCategory(category: SecurityCategory): RiskLevel {
    const riskLevels: Record<SecurityCategory, RiskLevel> = {
      financial: 'critical',
      data_loss: 'high',
      account: 'high',
      privacy: 'medium',
      content_modification: 'medium',
    };

    return riskLevels[category];
  }

  public static generateConfirmationMessage(
    assessment: SecurityAssessment,
    context: DestructiveActionContext
  ): string {
    const emoji = RISK_EMOJI[assessment.riskLevel];
    const categoryLabel = assessment.category
      ? ` [${assessment.category.replace('_', ' ').toUpperCase()}]`
      : '';

    let message = `${emoji} SECURITY CHECK${categoryLabel}\n`;
    message += `Risk: ${assessment.riskLevel.toUpperCase()}\n`;
    message += `Reason: ${assessment.reason}\n\n`;

    if (context.elementText) {
      message += `Element: "${context.elementText}"\n`;
    }
    if (context.pageUrl) {
      message += `Page: ${context.pageUrl}\n`;
    }

    message += `\nDo you want to proceed with this action?`;

    return message;
  }
}

export type { DestructiveActionContext, SecurityAssessment };

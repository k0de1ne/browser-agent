import type {
  BoundingBox,
  ComputedStyles,
  ParentElementInfo,
  SiblingElementInfo,
  ElementMatchType,
} from './common.types.js';

export interface SimplifiedElement {
  readonly id: string;
  readonly tag: string;
  readonly text?: string;
  readonly attributes: Record<string, string>;
  readonly interactable: boolean;
  readonly role?: string;
  readonly xpath?: string;
  readonly parent?: ParentElementInfo;
  readonly siblings?: readonly SiblingElementInfo[];
  readonly isContextElement?: boolean;
  readonly matchType?: ElementMatchType;
  readonly highlightedText?: string;
  readonly groupId?: string;
  readonly boundingBox?: BoundingBox;
  readonly isInViewport?: boolean;
  readonly zIndex?: number;
  readonly computedStyles?: ComputedStyles;
  readonly ariaLabel?: string;
  readonly semanticContext?: string;
  readonly nearbyText?: string;
}

export interface ContentFilter {
  readonly selectors?: string;
  readonly textContains?: string;
  readonly maxElements?: number;
  readonly includeHidden?: boolean;
  readonly prioritizeViewport?: boolean;
  readonly includeSemanticStructure?: boolean;
}

export interface PageContext {
  readonly url: string;
  readonly title: string;
  readonly description?: string;
  readonly mainContent?: string;
}

import type { Page } from 'playwright';
import { logger } from '../logger.js';
import type { SimplifiedElement, ContentFilter, PageContext } from '../types/dom.types.js';

import {
  INTERACTIVE_SELECTORS as _INTERACTIVE_SELECTORS,
  SEMANTIC_SELECTORS as _SEMANTIC_SELECTORS,
  MAIN_CONTENT_SELECTORS as _MAIN_CONTENT_SELECTORS,
  LANDMARK_SELECTORS as _LANDMARK_SELECTORS,
  IMPORTANT_ATTRIBUTES as _IMPORTANT_ATTRIBUTES,
} from '../constants/selectors.js';
import {
  DEFAULT_MAX_ELEMENTS as _DEFAULT_MAX_ELEMENTS,
  MAX_TEXT_LENGTH as _MAX_TEXT_LENGTH,
  MAX_NEARBY_TEXT_LENGTH as _MAX_NEARBY_TEXT_LENGTH,
  MAX_SEMANTIC_CONTEXT_LENGTH as _MAX_SEMANTIC_CONTEXT_LENGTH,
  MAX_HEADING_TEXT_LENGTH as _MAX_HEADING_TEXT_LENGTH,
  MAX_MAIN_CONTENT_LENGTH as _MAX_MAIN_CONTENT_LENGTH,
  MAX_HEADINGS_TO_DISPLAY as _MAX_HEADINGS_TO_DISPLAY,
} from '../constants/limits.js';

export type { SimplifiedElement, ContentFilter, PageContext };

type ElementData = SimplifiedElement;

export class DOMExtractor {
  public async extractSimplifiedDOM(
    page: Page,
    filter: ContentFilter = {}
  ): Promise<SimplifiedElement[]> {
    logger.debug('Extracting simplified DOM...', filter);

    const elements = await page.evaluate(filterParam => {
      const results: ElementData[] = [];
      let idCounter = 0;

      const getNearbyText = (el: HTMLElement): string => {
        const parent = el.parentElement;
        if (!parent) return '';

        let parentText = '';
        parent.childNodes.forEach(node => {
          if (node !== el && node.nodeType === Node.TEXT_NODE) {
            parentText += node.textContent?.trim() + ' ';
          }
        });

        return parentText.trim().substring(0, 100);
      };

      const getSemanticContext = (el: HTMLElement): string => {
        const contexts: string[] = [];

        const form = el.closest('form');
        if (form) {
          const formName = form.getAttribute('name') || form.getAttribute('id');
          if (formName) contexts.push(`in form "${formName}"`);
        }

        const nav = el.closest('nav, [role="navigation"]');
        if (nav) contexts.push('in navigation');

        const main = el.closest('main, [role="main"], article');
        if (main) contexts.push('in main content');

        const list = el.closest('ul, ol');
        if (list) contexts.push('in list');

        let current: Element | null = el;
        while (current && current !== document.body) {
          const prevHeading = current.previousElementSibling;
          if (prevHeading && /^H[1-6]$/.test(prevHeading.tagName)) {
            const headingText = prevHeading.textContent?.trim().substring(0, 50);
            if (headingText) contexts.push(`under "${headingText}"`);
            break;
          }
          current = current.parentElement;
        }

        return contexts.join(', ');
      };

      const isInViewport = (el: HTMLElement): boolean => {
        const rect = el.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      };

      const extractElementData = (el: Element, idCounter: number): SimplifiedElement => {
        const element = el as HTMLElement;
        const id = `el-${idCounter}`;

        element.setAttribute('data-agent-id', id);

        const attributes: Record<string, string> = {};
        [
          'href',
          'type',
          'placeholder',
          'value',
          'aria-label',
          'title',
          'name',
          'id',
          'class',
          'role',
          'data-testid',
        ].forEach(attr => {
          const value = element.getAttribute(attr);
          if (value) {
            attributes[attr] = value;
          }
        });

        let text = element.innerText?.trim().substring(0, 200) || '';
        if (!text && element.tagName === 'INPUT') {
          text = (element as HTMLInputElement).value || attributes.placeholder || '';
        }

        const rect = element.getBoundingClientRect();
        const boundingBox = {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };

        const style = window.getComputedStyle(element);
        const computedStyles = {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
        };

        const result: SimplifiedElement = {
          id,
          tag: element.tagName.toLowerCase(),
          text: text || undefined,
          attributes,
          interactable: true,
          role: element.getAttribute('role') || undefined,
          boundingBox,
          isInViewport: isInViewport(element),
          zIndex: parseInt(style.zIndex) || 0,
          computedStyles,
          ariaLabel: element.getAttribute('aria-label') || undefined,
          semanticContext: getSemanticContext(element),
          nearbyText: getNearbyText(element),
        };

        return result;
      };

      let selector: string;
      if (filterParam.selectors) {
        selector = filterParam.selectors;
      } else {
        selector = '*';
      }

      const allElements = Array.from(document.querySelectorAll(selector));

      let candidateElements = allElements.filter(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        if (!filterParam.includeHidden) {
          if (
            rect.width === 0 ||
            rect.height === 0 ||
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0'
          ) {
            return false;
          }
        }

        const tagName = el.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'meta', 'link'].includes(tagName)) {
          return false;
        }

        const hasText = el.textContent?.trim().length > 0;
        const hasAttributes = el.attributes.length > 0;
        const hasInteractivePotential = ['input', 'button', 'a', 'select', 'textarea'].includes(
          tagName
        );

        return hasText || hasAttributes || hasInteractivePotential;
      });

      candidateElements.forEach(el => {
        const elementData = extractElementData(el, idCounter++);
        results.push(elementData);
      });

      if (filterParam.prioritizeViewport !== false) {
        results.sort((a, b) => {
          if (a.isInViewport && !b.isInViewport) return -1;
          if (!a.isInViewport && b.isInViewport) return 1;
          return (a.boundingBox?.y || 0) - (b.boundingBox?.y || 0);
        });
      }

      return results;
    }, filter);

    let filtered = elements;

    if (filter.textContains) {
      const searchText = filter.textContains.toLowerCase();

      filtered = filtered.filter(el => {
        const elementText = el.text?.toLowerCase() || '';
        const attributeValues = Object.values(el.attributes).join(' ').toLowerCase();
        const nearbyText = el.nearbyText?.toLowerCase() || '';
        const semanticContext = el.semanticContext?.toLowerCase() || '';

        return (
          elementText.includes(searchText) ||
          attributeValues.includes(searchText) ||
          nearbyText.includes(searchText) ||
          semanticContext.includes(searchText)
        );
      });
    }

    const maxElements = filter.maxElements || 50;
    if (filtered.length > maxElements) {
      logger.debug(`Limiting results from ${filtered.length} to ${maxElements}`);
      filtered = filtered.slice(0, maxElements);
    }

    logger.debug(`Extracted ${filtered.length} elements (from ${elements.length} total)`);
    return filtered;
  }

  async getPageContext(page: Page): Promise<{
    url: string;
    title: string;
    description?: string;
    mainContent?: string;
  }> {
    const url = page.url();
    const title = await page.title();

    const context = await page.evaluate(() => {
      const description = document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content');

      const mainSelectors = ['main', 'article', '[role="main"]', '#content', '.content'];
      let mainContent = '';

      for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = element.textContent?.trim().substring(0, 500) || '';
          if (mainContent) break;
        }
      }

      return {
        description: description || undefined,
        mainContent: mainContent || undefined,
      };
    });

    return {
      url,
      title,
      ...context,
    };
  }

  formatElementsForLLM(elements: SimplifiedElement[], maxElements = 50): string {
    const limited = elements.slice(0, maxElements);

    const inViewport = limited.filter(el => el.isInViewport);
    const belowViewport = limited.filter(el => !el.isInViewport);

    const formatElement = (el: SimplifiedElement): string => {
      const parts: string[] = [];

      parts.push(`[${el.id}] ${el.tag}`);

      if (el.text) {
        parts.push(`"${el.text}"`);
      }

      const allAttrs: string[] = [];
      Object.entries(el.attributes).forEach(([key, value]) => {
        allAttrs.push(`${key}="${value}"`);
      });

      if (allAttrs.length > 0) {
        parts.push(`[${allAttrs.join(', ')}]`);
      }

      if (el.semanticContext) {
        parts.push(`{${el.semanticContext}}`);
      }

      if (el.nearbyText && el.nearbyText !== el.text) {
        parts.push(`(near: "${el.nearbyText}")`);
      }

      if (el.boundingBox) {
        parts.push(`@(${el.boundingBox.y}px)`);
      }

      return parts.join(' ');
    };

    const lines: string[] = [];

    if (inViewport.length > 0) {
      lines.push('=== VISIBLE IN VIEWPORT ===');
      lines.push(...inViewport.map(formatElement));
      lines.push('');
    }

    if (belowViewport.length > 0) {
      lines.push('=== BELOW VIEWPORT (need scroll) ===');
      lines.push(...belowViewport.map(formatElement));
    }

    return lines.join('\n');
  }

  async getPageStructure(page: Page): Promise<string> {
    return await page.evaluate(() => {
      const structure: string[] = [];

      const landmarks = [
        { selector: 'header, [role="banner"]', label: 'Header' },
        { selector: 'nav, [role="navigation"]', label: 'Navigation' },
        { selector: 'main, [role="main"]', label: 'Main Content' },
        { selector: 'aside, [role="complementary"]', label: 'Sidebar' },
        { selector: 'footer, [role="contentinfo"]', label: 'Footer' },
      ];

      structure.push('PAGE STRUCTURE:');

      landmarks.forEach(({ selector, label }) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          structure.push(`- ${label}: ${elements.length} section(s)`);
        }
      });

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      if (headings.length > 0) {
        structure.push('\nHEADINGS:');
        headings.slice(0, 10).forEach(h => {
          const level = h.tagName[1];
          const indent = '  '.repeat(parseInt(level) - 1);
          const text = h.textContent?.trim().substring(0, 60);
          structure.push(`${indent}${h.tagName}: ${text}`);
        });
      }

      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        structure.push(`\nFORMS: ${forms.length} form(s) found`);
      }

      return structure.join('\n');
    });
  }
}

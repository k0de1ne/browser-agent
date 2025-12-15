import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import { config } from '../config.js';
import { logger } from '../logger.js';
import {
  DEFAULT_VIEWPORT_WIDTH,
  DEFAULT_VIEWPORT_HEIGHT,
  DEFAULT_USER_AGENT,
  BROWSER_ARGS,
  DEFAULT_WAIT_UNTIL,
} from '../constants/browser.js';

interface TabInfo {
  readonly id: string;
  readonly url: string;
  readonly title: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private readonly pages: Map<string, Page> = new Map();
  private currentPageId: string | null = null;

  public async launch(): Promise<void> {
    logger.info('Launching browser...');

    this.browser = await chromium.launch({
      headless: config.browser.headless,
      args: [...BROWSER_ARGS],
    });

    this.context = await this.browser.newContext({
      viewport: { width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT },
      userAgent: DEFAULT_USER_AGENT,
    });

    const page = await this.context.newPage();
    const pageId = 'page-0';
    this.pages.set(pageId, page);
    this.currentPageId = pageId;

    logger.info(`Browser launched successfully with page: ${pageId}`);
  }

  public async launchPersistent(): Promise<void> {
    logger.info('Launching browser with persistent session...');

    this.context = await chromium.launchPersistentContext(config.browser.userDataDir, {
      headless: config.browser.headless,
      viewport: { width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT },
      args: [...BROWSER_ARGS],
    });

    const pages = this.context.pages();
    let page: Page;

    if (pages.length > 0) {
      page = pages[0];
    } else {
      page = await this.context.newPage();
    }

    const pageId = 'page-0';
    this.pages.set(pageId, page);
    this.currentPageId = pageId;

    logger.info(`Persistent browser launched with page: ${pageId}`);
  }

  public getCurrentPage(): Page {
    if (!this.currentPageId || !this.pages.has(this.currentPageId)) {
      throw new Error('No active page');
    }
    return this.pages.get(this.currentPageId)!;
  }

  public async createNewTab(url?: string): Promise<string> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const page = await this.context.newPage();
    const pageId = `page-${this.pages.size}`;
    this.pages.set(pageId, page);

    if (url) {
      await page.goto(url, { waitUntil: DEFAULT_WAIT_UNTIL });
    }

    logger.info(`Created new tab: ${pageId}${url ? ` and navigated to ${url}` : ''}`);
    return pageId;
  }

  public async switchTab(pageId: string): Promise<void> {
    if (!this.pages.has(pageId)) {
      throw new Error(`Page ${pageId} not found`);
    }

    this.currentPageId = pageId;
    const page = this.pages.get(pageId)!;
    await page.bringToFront();

    logger.info(`Switched to tab: ${pageId}`);
  }

  public async closeTab(pageId: string): Promise<void> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page ${pageId} not found`);
    }

    await page.close();
    this.pages.delete(pageId);

    if (this.currentPageId === pageId) {
      const remainingPages = Array.from(this.pages.keys());
      this.currentPageId = remainingPages.length > 0 ? remainingPages[0] : null;
    }

    logger.info(`Closed tab: ${pageId}`);
  }

  public listTabs(): readonly TabInfo[] {
    return Array.from(this.pages.entries()).map(([id, page]) => ({
      id,
      url: page.url(),
      title: page.url(),
    }));
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    this.pages.clear();
    this.currentPageId = null;
    logger.info('Browser closed');
  }
}

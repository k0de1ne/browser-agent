import dotenv from 'dotenv';
import type { AppConfig } from './types/config.types.js';
import { DEFAULT_NAVIGATION_TIMEOUT } from './constants/timeouts.js';

dotenv.config();

export const config: AppConfig = {
  llm: {
    baseURL: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
  },
  browser: {
    headless: process.env.HEADLESS === 'true',
    timeout: parseInt(process.env.BROWSER_TIMEOUT || String(DEFAULT_NAVIGATION_TIMEOUT), 10),
    userDataDir: './browser-data',
  },
};

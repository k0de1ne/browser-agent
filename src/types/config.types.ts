export interface LLMConfig {
  readonly baseURL: string | undefined;
  readonly model: string | undefined;
  readonly apiKey: string | undefined;
}

export interface BrowserConfig {
  readonly headless: boolean;
  readonly timeout: number;
  readonly userDataDir: string;
}

export interface AppConfig {
  readonly llm: LLMConfig;
  readonly browser: BrowserConfig;
}

export const INTERACTIVE_SELECTORS = [
  'a[href]',
  'button',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[onclick]',
  '[tabindex]',
  'summary',
] as const;

export const SEMANTIC_SELECTORS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'nav',
  'main',
  'article',
  'section',
  'header',
  'footer',
  '[role="navigation"]',
  '[role="main"]',
  '[role="banner"]',
  '[role="complementary"]',
] as const;

export const MAIN_CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '#content',
  '.content',
] as const;

export const LANDMARK_SELECTORS = [
  { selector: 'header, [role="banner"]', label: 'Header' },
  { selector: 'nav, [role="navigation"]', label: 'Navigation' },
  { selector: 'main, [role="main"]', label: 'Main Content' },
  { selector: 'aside, [role="complementary"]', label: 'Sidebar' },
  { selector: 'footer, [role="contentinfo"]', label: 'Footer' },
] as const;

export const IMPORTANT_ATTRIBUTES = [
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
] as const;

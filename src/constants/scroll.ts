export const SCROLL_AMOUNT = 500;

export const SCROLL_COMMANDS = {
  down: `window.scrollBy(0, ${SCROLL_AMOUNT})`,
  up: `window.scrollBy(0, -${SCROLL_AMOUNT})`,
  top: 'window.scrollTo(0, 0)',
  bottom: 'window.scrollTo(0, document.body.scrollHeight)',
} as const;

export type ScrollDirection = keyof typeof SCROLL_COMMANDS;

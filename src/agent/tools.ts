import type { ToolDefinition } from '../types/llm.types.js';

export const browserTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'navigate',
      description:
        'Navigate to a specific URL. Use wait() after navigation if page needs time to load.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The full URL to navigate to (must include protocol: http:// or https://)',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_structure',
      description:
        'Get page structure overview (headings, navigation, sections, forms). Use FIRST on new pages to understand layout.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_content',
      description:
        'Discover all interactive elements with unique IDs. Elements grouped by viewport visibility. Analyze results to choose relevant elements for your task.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description:
              'CSS selector to target specific elements. You decide what selector to use based on your task. Examples: "button" for buttons, "input" for form fields, "a[href*=\'cart\']" for cart links, "[data-testid]" for test elements. Be creative and adaptive.',
          },
          text_contains: {
            type: 'string',
            description:
              'Filter elements by their text content. Use this to find elements with specific text. Case-insensitive partial matching.',
          },
          max_elements: {
            type: 'number',
            description:
              'Maximum elements to return (default: 50). Adjust based on page complexity and your needs.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_element',
      description:
        'Find specific element using your chosen search criteria. Returns first matching element with ID for interaction.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description:
              'CSS selector you design based on page analysis. Examples: "button[class*=\'primary\']", "input[placeholder*=\'email\']", "a[href*=\'checkout\']"',
          },
          text: {
            type: 'string',
            description:
              'Search for elements containing this text. Use partial matches like "search" to find "Search Button", "Search Form", etc.',
          },
          attribute: {
            type: 'string',
            description:
              'Filter by any attribute name: "href", "type", "class", "id", "data-testid", "aria-label", "role", etc.',
          },
          attribute_value: {
            type: 'string',
            description:
              'Value pattern for the chosen attribute. Supports partial matching. Use with "attribute" parameter.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_element_info',
      description:
        'Get detailed info about a specific element: all attributes, text content, parent/children elements.',
      parameters: {
        type: 'object',
        properties: {
          element_id: {
            type: 'string',
            description: 'Element ID from get_page_content or find_element',
          },
        },
        required: ['element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_page_text',
      description:
        "Read visible text from the page or specific element. Good for checking what's on the page.",
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description:
              'CSS selector to read text from. Examples: "main", ".content", "body". Leave empty to read whole page.',
          },
          max_length: {
            type: 'number',
            description: 'Max characters to return (default: 2000)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'click',
      description: 'Click on an element on the page using its element ID from get_page_content',
      parameters: {
        type: 'object',
        properties: {
          element_id: {
            type: 'string',
            description: 'The element ID (e.g., "el-0", "el-1") from get_page_content response',
          },
        },
        required: ['element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'type_text',
      description:
        'Type text into input field or textarea. Use get_page_content after typing if Enter triggers navigation/search.',
      parameters: {
        type: 'object',
        properties: {
          element_id: {
            type: 'string',
            description:
              'The element ID obtained from get_page_content or find_element (e.g., "el-0", "el-1")',
          },
          text: {
            type: 'string',
            description: 'The text content to type into the field',
          },
          press_enter: {
            type: 'boolean',
            description:
              'Whether to press Enter key after typing (default: false). Use true for search boxes, forms that submit on Enter, etc.',
          },
        },
        required: ['element_id', 'text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scroll',
      description: 'Scroll the page to reveal more content',
      parameters: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            enum: ['up', 'down', 'top', 'bottom'],
            description: 'The direction to scroll',
          },
        },
        required: ['direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wait',
      description: 'Wait for a specified amount of time (in milliseconds) for content to load',
      parameters: {
        type: 'object',
        properties: {
          milliseconds: {
            type: 'number',
            description: 'Time to wait in milliseconds (max 10000)',
          },
        },
        required: ['milliseconds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'new_tab',
      description: 'Open a new browser tab, optionally navigating to a URL',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Optional URL to navigate to in the new tab',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'switch_tab',
      description: 'Switch to a different browser tab',
      parameters: {
        type: 'object',
        properties: {
          tab_id: {
            type: 'string',
            description: 'The ID of the tab to switch to (e.g., "page-0", "page-1")',
          },
        },
        required: ['tab_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tabs',
      description: 'List all open browser tabs with their IDs and URLs',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_tab',
      description: 'Close a browser tab',
      parameters: {
        type: 'object',
        properties: {
          tab_id: {
            type: 'string',
            description: 'The ID of the tab to close',
          },
        },
        required: ['tab_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'go_back',
      description: 'Navigate back to the previous page in browser history',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'take_screenshot',
      description: 'Take a screenshot of the current page',
      parameters: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: 'Optional filename for the screenshot (default: auto-generated)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extract_text',
      description: 'Extract text content from a specific element',
      parameters: {
        type: 'object',
        properties: {
          element_id: {
            type: 'string',
            description: 'The element ID to extract text from',
          },
        },
        required: ['element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ask_user',
      description:
        'Request human assistance as last resort. Use for CAPTCHA, authentication, 2FA, or after exhausting automated approaches.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description:
              'Clear, specific question for user. Be explicit about required action. Example: "Please enter the 6-digit code sent to your phone"',
          },
          reason: {
            type: 'string',
            description:
              'Concise explanation of why human help is needed. Examples: "CAPTCHA detected", "Authentication required", "2FA verification", "Ambiguous page state"',
          },
        },
        required: ['question', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_plan',
      description:
        'Create or update execution plan. Break task into steps, track progress, adapt strategy. Use at task start and when strategy changes.',
      parameters: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            description:
              'Array of specific, actionable steps to accomplish the task. Each step should be clear and verifiable.',
            items: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Clear description of what this step accomplishes',
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed', 'failed'],
                  description: 'Current status of this step',
                },
              },
              required: ['description', 'status'],
            },
          },
          current_step_index: {
            type: 'number',
            description: 'Index (0-based) of the step you are currently working on',
          },
          completion_criteria: {
            type: 'array',
            description: 'List of criteria that must be met to consider the task complete',
            items: {
              type: 'string',
            },
          },
          adaptations: {
            type: 'array',
            description:
              'Optional: Notes about how you adapted the plan based on obstacles or new information',
            items: {
              type: 'string',
            },
          },
        },
        required: ['steps', 'current_step_index', 'completion_criteria'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description:
        'Finalize task and return results. Call ONLY when: (1) ALL requirements fulfilled and verified [success=true], OR (2) After exhausting 5+ approaches without success [success=false].',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description:
              'Execution summary. Success: list accomplishments and results. Failure: describe attempts, failures, and reasons.',
          },
          success: {
            type: 'boolean',
            description:
              'true = All requirements met and completed. false = Task could not be completed despite multiple attempts.',
          },
        },
        required: ['summary', 'success'],
      },
    },
  },
];

export const DESTRUCTIVE_ACTIONS = ['click'] as const;

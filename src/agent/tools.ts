import type { ToolDefinition } from '../types/llm.types.js';

export const browserTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'navigate',
      description: 'Navigate to a specific URL. This is typically the first step in any web automation task. After navigation, the page may take time to load - consider using wait() if needed.',
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
      description: 'Get a high-level overview of the page structure (headings, navigation, main sections, forms). Use this FIRST when arriving at a new page to understand the layout before looking for specific elements. This helps you orient yourself and find the right section of the page.',
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
      description: 'Discover elements on the current page. Returns ALL potentially relevant elements with unique IDs for interaction. You must analyze the results and decide which elements are useful for your task. Elements are grouped by viewport visibility. Use this to understand what\'s available on the page and make intelligent decisions about what to interact with.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector to target specific elements. You decide what selector to use based on your task. Examples: "button" for buttons, "input" for form fields, "a[href*=\'cart\']" for cart links, "[data-testid]" for test elements. Be creative and adaptive.',
          },
          text_contains: {
            type: 'string',
            description: 'Filter elements by their text content. Use this to find elements with specific text. Case-insensitive partial matching.',
          },
          max_elements: {
            type: 'number',
            description: 'Maximum elements to return (default: 50). Adjust based on page complexity and your needs.',
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
      description: 'Find a specific element using YOUR chosen search criteria. You decide the best way to locate elements based on the page structure and your task. Returns the first matching element with an ID for interaction.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector YOU design based on page analysis. Be creative: "button[class*=\'primary\']", "input[placeholder*=\'email\']", "a[href*=\'checkout\']", "[data-testid*=\'submit\']"',
          },
          text: {
            type: 'string',
            description: 'Search for elements containing this text. Use partial matches like "search" to find "Search Button", "Search Form", etc.',
          },
          attribute: {
            type: 'string',
            description: 'Filter by ANY attribute name. You choose: "href", "type", "class", "id", "data-testid", "aria-label", "role", etc.',
          },
          attribute_value: {
            type: 'string',
            description: 'Value pattern for the chosen attribute. Supports partial matching. Use with "attribute" parameter.',
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
      description: 'Get detailed info about a specific element: all attributes, text content, parent/children elements.',
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
      description: 'Read visible text from the page or specific element. Good for checking what\'s on the page.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector to read text from. Examples: "main", ".content", "body". Leave empty to read whole page.',
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
      description: 'Type text into an input field. The element must be an input, textarea, or other editable field. After typing, consider calling get_page_content to verify the page state, especially if pressing Enter triggers navigation or search.',
      parameters: {
        type: 'object',
        properties: {
          element_id: {
            type: 'string',
            description: 'The element ID obtained from get_page_content or find_element (e.g., "el-0", "el-1")',
          },
          text: {
            type: 'string',
            description: 'The text content to type into the field',
          },
          press_enter: {
            type: 'boolean',
            description: 'Whether to press Enter key after typing (default: false). Use true for search boxes, forms that submit on Enter, etc.',
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
      description: 'Request human assistance when automated solutions are insufficient. Use this as a last resort after exhausting automated approaches. Common scenarios: CAPTCHA challenges, authentication requirements, 2FA verification, ambiguous instructions, or manual interventions needed. The agent will pause and wait for user response.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'Clear, specific question or instruction for the user. Be explicit about what action they need to take. Good: "Please enter the 6-digit code sent to your phone". Bad: "Need help".',
          },
          reason: {
            type: 'string',
            description: 'Concise explanation of why human help is needed. Examples: "CAPTCHA detected", "Authentication required", "2FA verification", "Ambiguous page state"',
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
      description: 'Create or update your execution plan for the current task. Use this to break down the task into specific steps, track progress, and adapt your strategy. Call this at the start of a task to create a plan, and whenever you need to update it based on new information or changed circumstances.',
      parameters: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            description: 'Array of specific, actionable steps to accomplish the task. Each step should be clear and verifiable.',
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
            description: 'Optional: Notes about how you adapted the plan based on obstacles or new information',
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
      description: 'Finalize the task and return results to the user. This marks the end of execution. Call this ONLY when: (1) ALL requirements of the original request are fulfilled and verified [success=true], OR (2) After exhausting all reasonable approaches (5+ different strategies) without success [success=false]. Never call this prematurely - ensure every step is complete.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Comprehensive summary of execution. For success: list what was accomplished and any relevant results. For failure: describe what was attempted, what failed, and why. Be specific and informative.',
          },
          success: {
            type: 'boolean',
            description: 'true = All requirements met, task fully completed. false = Task could not be completed despite multiple attempts. Set this accurately based on actual results, not intentions.',
          },
        },
        required: ['summary', 'success'],
      },
    },
  },
];

export const DESTRUCTIVE_ACTIONS = ['click'] as const;

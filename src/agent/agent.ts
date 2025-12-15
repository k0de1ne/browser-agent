import OpenAI from 'openai';
import { BrowserManager } from '../browser/manager.js';
import { DOMExtractor, SimplifiedElement, ContentFilter } from '../browser/dom-extractor.js';
import { LLMClient } from '../llm.js';
import { browserTools } from './tools.js';
import { logger } from '../logger.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { AgentVisualizer } from './visualizer.js';
import { TaskPlan } from './planning-system.js';
import { SecurityLayer } from './security.js';

export interface AgentConfig {
  requireConfirmation?: boolean;
  maxIterations?: number;
  enableThinking?: boolean;
  showThinkingProcess?: boolean;
  showPlanVisualization?: boolean;
  showActionHistory?: boolean;
}

const SYSTEM_PROMPT = `You are an intelligent web automation agent. You help users accomplish tasks by autonomously controlling a web browser.

=== YOUR APPROACH ===

Think step-by-step and adapt to challenges. You have tools to:
- Navigate websites and interact with elements
- Understand page structure and find elements
- Handle complex multi-step workflows
- Ask for help when truly needed

=== CORE PRINCIPLES ===

1. **Be Autonomous**: Always use tools, never just talk. Complete the full task before calling complete_task().
2. **Think Adaptively**: When something fails, try different approaches. Don't give up easily.
3. **Plan Dynamically**: 
   - At task start, call update_plan() to outline your approach
   - Update the plan as you work (mark steps completed, add new insights)
   - Let your plan evolve based on what you discover
4. **Verify Everything**: After each action, check if it worked before moving on.

=== DISCOVERY WORKFLOW ===

When you arrive at a new page:
1. Call get_page_structure() to understand the layout
2. Call get_page_content() to see interactive elements  
3. Then take action (click, type, etc.)

Elements are grouped by visibility - focus on viewport elements first.

=== FINDING ELEMENTS ===

You are in control - decide YOUR own approach:

**Dynamic Element Discovery:**
- get_page_content() shows ALL elements - YOU decide what's relevant
- Design YOUR own selectors based on page analysis
- No predefined patterns - adapt to each site's unique structure
- Use semantic context to understand element relationships

**Creative Selector Strategies:**
- Analyze page structure first, then craft targeted selectors
- Combine attributes: "button[class*='primary'][type='submit']"
- Use partial matching: "[href*='cart']" for cart-related links
- Think contextually: "nav a" for navigation, "form input" for forms
- Exploit unique identifiers: "[data-testid]" when available

**Adaptive Search:**
- If one approach fails, try completely different strategies
- Look for text patterns, then attribute patterns, then structural patterns
- Each page is unique - treat it as such
- Use get_page_content() to explore, then find_element() for precision

**Remember:** There are no "correct" selectors - only what works for the specific page and task. Be creative and persistent.

=== PLANNING ===

Create flexible plans that adapt:

update_plan({
  steps: [
    {description: "Navigate to site", status: "pending"},
    {description: "Find and fill search", status: "pending"},
    {description: "Process results", status: "pending"}
  ],
  current_step_index: 0,
  completion_criteria: ["Task objective achieved"],
  adaptations: []
})

Mark steps as completed as you finish them. Add new steps if needed. Let your plan be a living document.

=== PROBLEM SOLVING ===

If stuck:
1. Try different selectors/search strategies (3-5 attempts)
2. Check page structure with get_page_structure()
3. Read page text to understand what's there
4. Scroll or wait for dynamic content
5. Adapt your plan with new approach
6. Only use ask_user() for CAPTCHAs, authentication, or after exhausting options

=== COMPLETION ===

Call complete_task(summary, success) when:
- **success=true**: Main objective achieved OR significant progress made
- **success=false**: Tried multiple approaches (3+), cannot proceed

**BE AGGRESSIVE WITH COMPLETION:**
- For cart tasks: Complete as soon as item is added to cart
- For search tasks: Complete when results are found and displayed
- For navigation tasks: Complete when target page is reached
- Don't over-optimize - complete when core requirement is satisfied

Verify main objective, then complete quickly.

=== SECURITY ===

A security layer will prompt for confirmation on sensitive actions (payments, deletions, etc.). This is automatic - just proceed normally.

Remember: You're capable and autonomous. Think creatively, adapt to challenges, and complete tasks thoroughly.`;

export class BrowserAgent {
  private browserManager: BrowserManager;
  private domExtractor: DOMExtractor;
  private llmClient: LLMClient;
  private config: AgentConfig;
  private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private currentElements: SimplifiedElement[] = [];
  private isTaskComplete = false;
  private visualizer: AgentVisualizer;
  private currentPlan: TaskPlan | null = null;
  private confirmedActions = new Set<string>();

  constructor(config: AgentConfig = {}) {
    this.browserManager = new BrowserManager();
    this.domExtractor = new DOMExtractor();
    this.llmClient = new LLMClient();
    this.visualizer = new AgentVisualizer();
    this.config = {
      requireConfirmation: config.requireConfirmation ?? true,
      maxIterations: config.maxIterations ?? 50,
      enableThinking: config.enableThinking ?? true,
      showThinkingProcess: config.showThinkingProcess ?? true,
      showPlanVisualization: config.showPlanVisualization ?? true,
      showActionHistory: config.showActionHistory ?? true,
    };
  }

  async initialize(persistent = false): Promise<void> {
    if (persistent) {
      await this.browserManager.launchPersistent();
    } else {
      await this.browserManager.launch();
    }

    this.conversationHistory.push({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
  }

  async executeTask(task: string): Promise<void> {
    logger.info(chalk.cyan(`\n${'='.repeat(60)}`));
    logger.info(chalk.cyan(`Task: ${task}`));
    logger.info(chalk.cyan(`${'='.repeat(60)}\n`));

    this.conversationHistory.push({
      role: 'user',
      content: task,
    });

    if (this.config.showPlanVisualization) {
      this.currentPlan = {
        goal: task,
        steps: [],
        currentStepIndex: 0,
        adaptations: [],
        completionCriteria: [],
      };
      this.visualizer.setPlan(this.currentPlan);
    }

    this.isTaskComplete = false;
    this.confirmedActions.clear();
    let iteration = 0;

    while (!this.isTaskComplete && iteration < this.config.maxIterations!) {
      iteration++;

      if (this.config.showPlanVisualization) {
        this.visualizer.displayIterationSummary(iteration, this.config.maxIterations!);
      } else {
        logger.info(chalk.gray(`\n--- Iteration ${iteration} ---\n`));
      }

      try {
        logger.info(chalk.magenta('📤 Sending request to LLM...'));

        let currentThinking = '';
        const onThinkingUpdate = this.config.showThinkingProcess
          ? (thinking: string) => {
              if (this.config.showPlanVisualization) {
                this.visualizer.displayThinking(thinking, true);
              } else {
                if (currentThinking.length === 0) {
                  logger.info(chalk.blue('\n🧠 Agent is thinking...'));
                  logger.info(chalk.gray('─'.repeat(60)));
                }

                if (thinking.length > currentThinking.length) {
                  const newThinking = thinking.substring(currentThinking.length);
                  process.stdout.write(chalk.cyan(newThinking));
                  currentThinking = thinking;
                }
              }
            }
          : undefined;

        const response = await this.llmClient.chat(
          this.conversationHistory,
          browserTools,
          'required',
          {
            enableThinking: this.config.enableThinking,
            onThinkingUpdate,
          }
        );

        const message = response.choices[0]?.message;
        if (!message) {
          throw new Error('No response from LLM');
        }

        if (this.config.showPlanVisualization && currentThinking.length > 0) {
          this.visualizer.finishThinking();
        }

        logger.info(chalk.magenta('\n📥 LLM Response:'));

        if (message.content) {
          logger.info(chalk.blue(`\n💬 Response: ${message.content}\n`));
        }
        if (message.tool_calls && message.tool_calls.length > 0) {
          logger.info(chalk.cyan(`   🔧 Tool calls: ${message.tool_calls.length}`));
        }
        logger.info(
          chalk.gray(
            `   📊 Tokens: prompt=${response.usage?.prompt_tokens}, completion=${response.usage?.completion_tokens}, total=${response.usage?.total_tokens}`
          )
        );
        logger.info(chalk.gray(`   ⏱️  Model: ${response.model}`));

        this.conversationHistory.push(message);

        if (message.tool_calls && message.tool_calls.length > 0) {
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            if (this.config.showPlanVisualization) {
              this.visualizer.displayCurrentStep(iteration, toolName, toolArgs);
            } else {
              logger.info(chalk.yellow(`🔧 Tool: ${toolName}`));
              logger.info(chalk.gray(`   Args: ${JSON.stringify(toolArgs)}`));
            }

            if (this.config.requireConfirmation && this.shouldConfirm(toolName, toolArgs)) {
              const confirmed = await this.confirmAction(toolName, toolArgs);
              if (!confirmed) {
                this.conversationHistory.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: 'Action cancelled by user',
                });
                continue;
              }
            }

            let result: any;
            let toolSuccess = true;
            try {
              result = await this.executeTool(toolName, toolArgs);
            } catch (error: any) {
              toolSuccess = false;
              result = `Error: ${error.message}`;
            }

            this.conversationHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: typeof result === 'string' ? result : JSON.stringify(result),
            });

            const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
            if (this.config.showPlanVisualization) {
              if (toolName !== 'complete_task') {
                this.visualizer.displayStepResult(resultStr, toolSuccess ? 'success' : 'failed');
              }

              if (this.config.showActionHistory) {
                this.visualizer.addActionToHistory({
                  iteration,
                  timestamp: new Date(),
                  tool: toolName,
                  args: toolArgs,
                  result: resultStr,
                  status: toolSuccess ? 'success' : 'failed',
                });
              }
            } else {
              if (toolName !== 'complete_task') {
                const icon = toolSuccess ? '✓' : '✗';
                const color = toolSuccess ? chalk.green : chalk.red;
                logger.info(color(`   ${icon} Result: ${resultStr.substring(0, 100)}`));
              }
            }
          }
        } else {
          logger.warn(
            chalk.yellow('⚠️  No tool calls received despite using tool_choice: required')
          );
          throw new Error('Model did not return tool calls as required');
        }
      } catch (error: any) {
        logger.error(chalk.red(`Error: ${error.message}`));

        this.conversationHistory.push({
          role: 'user',
          content: `An error occurred: ${error.message}. Please try a different approach.`,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!this.isTaskComplete) {
      logger.warn(chalk.yellow(`\nTask reached maximum iterations (${this.config.maxIterations})`));
    }
  }

  private shouldConfirm(toolName: string, args: any): boolean {
    const page = this.browserManager.getCurrentPage();
    const element = this.currentElements.find(el => el.id === args.element_id);
    const context = {
      action: toolName,
      elementText: element?.text,
      elementAttributes: element?.attributes,
      pageUrl: page.url(),
      semanticContext: element?.semanticContext,
    };

    const assessment = SecurityLayer.assessAction(context);

    if (assessment.riskLevel === 'low') {
      return false;
    }

    const actionKey = `${toolName}:${element?.text || ''}:${assessment.category}`;

    if (this.confirmedActions.has(actionKey)) {
      return false;
    }

    return (
      assessment.isDestructive &&
      (assessment.riskLevel === 'medium' ||
        assessment.riskLevel === 'high' ||
        assessment.riskLevel === 'critical')
    );
  }

  private async confirmAction(toolName: string, args: any): Promise<boolean> {
    const page = this.browserManager.getCurrentPage();
    const element = this.currentElements.find(el => el.id === args.element_id);

    const context = {
      action: toolName,
      elementText: element?.text,
      elementAttributes: element?.attributes,
      pageUrl: page.url(),
      semanticContext: element?.semanticContext,
    };

    const assessment = SecurityLayer.assessAction(context);
    const message = SecurityLayer.generateConfirmationMessage(assessment, context);

    console.log('\n' + chalk.yellow('═'.repeat(60)));
    console.log(chalk.yellow.bold(message));
    console.log(chalk.yellow('═'.repeat(60)) + '\n');

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: chalk.yellow('Proceed?'),
        default: false,
      },
    ]);

    if (answer.confirmed) {
      const actionKey = `${toolName}:${element?.text || ''}:${assessment.category}`;
      this.confirmedActions.add(actionKey);
    }

    return answer.confirmed;
  }

  private async executeTool(toolName: string, args: any): Promise<any> {
    const page = this.browserManager.getCurrentPage();

    switch (toolName) {
      case 'navigate':
        await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1000);
        return `Navigated to ${args.url}`;

      case 'get_page_structure': {
        const structure = await this.domExtractor.getPageStructure(page);
        const context = await this.domExtractor.getPageContext(page);
        return `Page: ${context.title}\nURL: ${context.url}\n\n${structure}\n\nUse get_page_content to see interactive elements you can click or type into.`;
      }

      case 'get_page_content': {
        const context = await this.domExtractor.getPageContext(page);
        const filter: ContentFilter = {
          selectors: args.selector,
          textContains: args.text_contains,
          maxElements: args.max_elements || 50,
          prioritizeViewport: true,
          includeSemanticStructure: true,
        };

        this.currentElements = await this.domExtractor.extractSimplifiedDOM(page, filter);
        const elementsStr = this.domExtractor.formatElementsForLLM(
          this.currentElements,
          filter.maxElements || 50
        );

        const inViewport = this.currentElements.filter(el => el.isInViewport).length;
        const belowViewport = this.currentElements.length - inViewport;

        return `Page: ${context.title}\nURL: ${context.url}\n\nFound ${this.currentElements.length} elements (${inViewport} visible, ${belowViewport} below viewport):\n\n${elementsStr}`;
      }

      case 'find_element': {
        const elements = await page.evaluate(
          ({ selector, text, attribute, attributeValue }) => {
            let candidates: Element[] = [];
            if (selector) {
              candidates = Array.from(document.querySelectorAll(selector));
            } else {
              candidates = Array.from(
                document.querySelectorAll(
                  'a, button, input, textarea, select, [role="button"], [onclick]'
                )
              );
            }

            if (text) {
              const searchText = text.toLowerCase();
              candidates = candidates.filter(el => {
                const elText = (el as HTMLElement).innerText?.toLowerCase() || '';
                const value = (el as HTMLInputElement).value?.toLowerCase() || '';
                return elText.includes(searchText) || value.includes(searchText);
              });
            }

            if (attribute && attributeValue) {
              candidates = candidates.filter(el => {
                const attrVal = el.getAttribute(attribute);
                return attrVal && attrVal.includes(attributeValue);
              });
            }

            if (candidates.length > 0) {
              const el = candidates[0] as HTMLElement;
              const id = `el-${Date.now()}`;
              el.setAttribute('data-agent-id', id);

              const attributes: Record<string, string> = {};
              ['href', 'type', 'placeholder', 'value', 'class', 'id', 'name'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value) attributes[attr] = value;
              });

              return {
                found: true,
                id,
                tag: el.tagName.toLowerCase(),
                text:
                  el.innerText?.trim().substring(0, 100) || (el as HTMLInputElement).value || '',
                attributes,
                total_matches: candidates.length,
              };
            }

            return { found: false, total_matches: 0 };
          },
          {
            selector: args.selector,
            text: args.text,
            attribute: args.attribute,
            attributeValue: args.attributeValue,
          }
        );

        if (elements.found) {
          this.currentElements = [
            {
              id: elements.id || '',
              tag: elements.tag || '',
              text: elements.text,
              attributes: elements.attributes || {},
              interactable: true,
            },
          ];
          return `Found element [${elements.id}] ${elements.tag} "${elements.text}" (${elements.total_matches} total matches)\nAttributes: ${JSON.stringify(elements.attributes)}`;
        } else {
          return `No element found. Try different selector/text/attribute or use get_page_content to see all elements.`;
        }
      }

      case 'get_element_info': {
        const selector = `[data-agent-id="${args.element_id}"]`;
        try {
          const info = await page.evaluate(sel => {
            const el = document.querySelector(sel) as HTMLElement;
            if (!el) return null;

            const attributes: Record<string, string> = {};
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              attributes[attr.name] = attr.value;
            }

            const parent = el.parentElement;
            const parentInfo = parent
              ? {
                  tag: parent.tagName.toLowerCase(),
                  class: parent.className,
                  id: parent.id,
                  text: parent.innerText?.trim().substring(0, 50),
                }
              : null;

            const children = Array.from(el.children)
              .slice(0, 5)
              .map(child => ({
                tag: child.tagName.toLowerCase(),
                class: child.className,
                text: (child as HTMLElement).innerText?.trim().substring(0, 30),
              }));

            return {
              tag: el.tagName.toLowerCase(),
              text: el.innerText?.trim() || (el as HTMLInputElement).value || '',
              attributes,
              parent: parentInfo,
              children: children.length > 0 ? children : null,
              html: el.outerHTML.substring(0, 200),
            };
          }, selector);

          if (!info) {
            return `Element ${args.element_id} not found`;
          }

          return `Element ${args.element_id}:\nTag: ${info.tag}\nText: ${info.text}\nAttributes: ${JSON.stringify(info.attributes, null, 2)}\nParent: ${JSON.stringify(info.parent)}\nChildren: ${JSON.stringify(info.children)}\nHTML: ${info.html}...`;
        } catch (error: any) {
          return `Error getting element info: ${error.message}`;
        }
      }

      case 'read_page_text': {
        try {
          const text = await page.evaluate(
            ({ selector, maxLength }) => {
              let element: Element | null = null;

              if (selector) {
                element = document.querySelector(selector);
              } else {
                const mainSelectors = ['main', 'article', '[role="main"]', '#content', '.content'];
                for (const sel of mainSelectors) {
                  element = document.querySelector(sel);
                  if (element) break;
                }
                if (!element) element = document.body;
              }

              if (!element) return '';

              const fullText = element.textContent?.trim() || '';
              return fullText.substring(0, maxLength || 2000);
            },
            { selector: args.selector, maxLength: args.max_length }
          );

          return `Page text (${text.length} chars):\n\n${text}`;
        } catch (error: any) {
          return `Error reading text: ${error.message}`;
        }
      }

      case 'click': {
        const selector = `[data-agent-id="${args.element_id}"]`;
        try {
          await page.click(selector, { timeout: 5000 });
          await page.waitForTimeout(1000);
          return `Clicked element ${args.element_id}. Call get_page_content to see the updated page.`;
        } catch (error: any) {
          return `Failed to click ${args.element_id}: ${error.message}. Try scrolling to the element or using a different element ID.`;
        }
      }

      case 'type_text': {
        const selector = `[data-agent-id="${args.element_id}"]`;
        try {
          await page.fill(selector, args.text, { timeout: 5000 });
          if (args.press_enter) {
            await page.press(selector, 'Enter');
            await page.waitForTimeout(2000);
            return `Typed "${args.text}" into ${args.element_id} and pressed Enter. Waiting for results... Call get_page_content to see them.`;
          }
          await page.waitForTimeout(500);
          return `Typed "${args.text}" into ${args.element_id}`;
        } catch (error: any) {
          return `Failed to type into ${args.element_id}: ${error.message}. Make sure this is an input field. Try a different element ID.`;
        }
      }

      case 'scroll': {
        const scrollMap: Record<string, string> = {
          down: 'window.scrollBy(0, 500)',
          up: 'window.scrollBy(0, -500)',
          top: 'window.scrollTo(0, 0)',
          bottom: 'window.scrollTo(0, document.body.scrollHeight)',
        };
        await page.evaluate(scrollMap[args.direction]);
        await page.waitForTimeout(500);
        return `Scrolled ${args.direction}`;
      }

      case 'wait':
        const ms = Math.min(args.milliseconds, 10000);
        await page.waitForTimeout(ms);
        return `Waited ${ms}ms`;

      case 'new_tab': {
        const tabId = await this.browserManager.createNewTab(args.url);
        return `Created new tab: ${tabId}${args.url ? ` at ${args.url}` : ''}`;
      }

      case 'switch_tab':
        await this.browserManager.switchTab(args.tab_id);
        return `Switched to tab ${args.tab_id}`;

      case 'list_tabs': {
        const tabs = this.browserManager.listTabs();
        return `Open tabs:\n${tabs.map(t => `- ${t.id}: ${t.url}`).join('\n')}`;
      }

      case 'close_tab':
        await this.browserManager.closeTab(args.tab_id);
        return `Closed tab ${args.tab_id}`;

      case 'go_back':
        await page.goBack({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        return 'Navigated back';

      case 'take_screenshot': {
        const filename = args.filename || `screenshot-${Date.now()}.png`;
        await page.screenshot({ path: filename, fullPage: false });
        return `Screenshot saved: ${filename}`;
      }

      case 'extract_text': {
        const selector = `[data-agent-id="${args.element_id}"]`;
        const text = await page.textContent(selector);
        return text || 'No text found';
      }

      case 'update_plan': {
        const steps = args.steps.map((step: any, index: number) => ({
          id: `step-${index + 1}`,
          description: step.description,
          status: step.status || 'pending',
        }));

        this.currentPlan = {
          goal: this.currentPlan?.goal || 'Current task',
          steps,
          currentStepIndex: args.current_step_index || 0,
          adaptations: args.adaptations || this.currentPlan?.adaptations || [],
          completionCriteria: args.completion_criteria || [],
        };

        if (this.config.showPlanVisualization) {
          this.visualizer.setPlan(this.currentPlan);
        }

        const summary = `Plan updated: ${steps.length} steps, currently on step ${args.current_step_index + 1}`;
        logger.info(chalk.blue(`📋 ${summary}`));
        return summary;
      }

      case 'ask_user': {
        logger.info(chalk.yellow(`\n${'='.repeat(60)}`));
        logger.info(chalk.yellow.bold(`🤝 Agent needs your help!`));
        logger.info(chalk.yellow(`Reason: ${args.reason}`));
        logger.info(chalk.yellow(`${'='.repeat(60)}\n`));

        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'userResponse',
            message: chalk.cyan(args.question),
          },
        ]);

        logger.info(chalk.green(`\n✓ User response received\n`));
        return `User responded: ${answer.userResponse}`;
      }

      case 'complete_task':
        this.isTaskComplete = true;

        if (this.config.showPlanVisualization) {
          this.visualizer.displayTaskCompletion(args.success, args.summary);
          if (this.config.showActionHistory) {
            this.visualizer.displayActionHistory(10);
          }
        } else {
          logger.info(chalk.green.bold(`\n${'='.repeat(60)}`));
          logger.info(chalk.green.bold(`✓ Task Completed!`));
          logger.info(chalk.green(`Status: ${args.success ? 'Success' : 'Failed'}`));
          logger.info(chalk.green(`Summary: ${args.summary}`));
          logger.info(chalk.green.bold(`${'='.repeat(60)}\n`));
        }

        return args.summary;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async shutdown(): Promise<void> {
    await this.browserManager.close();
    logger.info('Agent shut down');
  }
}

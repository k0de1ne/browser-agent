#!/usr/bin/env node

import { BrowserAgent } from './agent/agent.js';
import { logger } from './logger.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

async function main() {
  console.clear();
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║        AI Browser Automation Agent                        ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

  const agent = new BrowserAgent({
    requireConfirmation: true,
    maxIterations: 50,
    enableThinking: true,
    showThinkingProcess: true,
    showPlanVisualization: true,
    showActionHistory: true,
  });

  try {
    await agent.initialize(true);

    while (true) {
      const { task } = await inquirer.prompt([
        {
          type: 'input',
          name: 'task',
          message: chalk.green('\nWhat would you like me to do? (or "exit" to quit)'),
          validate: (input: string) => (input.trim() ? true : 'Please enter a task'),
        },
      ]);

      if (task.toLowerCase().trim() === 'exit') break;

      try {
        await agent.executeTask(task);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Task failed: ${errorMessage}`);
      }

      const { continueAgent } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAgent',
          message: 'Would you like to give another task?',
          default: true,
        },
      ]);

      if (!continueAgent) break;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Fatal error: ${errorMessage}`);
    console.error(error);
  } finally {
    await agent.shutdown();
    console.log(chalk.cyan('\nGoodbye! 👋\n'));
  }
}

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nShutting down gracefully...'));
  process.exit(0);
});

process.on('unhandledRejection', (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`Unhandled rejection: ${errorMessage}`);
  console.error(error);
});

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`Application error: ${errorMessage}`);
  console.error(error);
  process.exit(1);
});

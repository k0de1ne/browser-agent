import chalk from 'chalk';
import type { TaskStep, TaskPlan, ActionHistoryItem } from '../types/agent.types.js';
import type { TaskStepStatus } from '../types/common.types.js';

export class AgentVisualizer {
  private currentPlan: TaskPlan | null = null;
  private actionHistory: ActionHistoryItem[] = [];
  private thinkingBuffer = '';

  public setPlan(plan: TaskPlan): void {
    this.currentPlan = plan;
    this.displayPlan();
  }

  public updateStepStatus(stepId: string, status: TaskStepStatus, result?: string): void {
    if (!this.currentPlan) {
      return;
    }

    const step = this.currentPlan.steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
      if (result) {
        (step as { result?: string }).result = result;
      }
      this.displayPlan();
    }
  }

  public displayPlan(): void {
    if (!this.currentPlan) return;

    console.log('\n' + chalk.bgBlue.white.bold(' 📋 ПЛАН ЗАДАЧИ '));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white.bold(this.currentPlan.goal));
    console.log(chalk.gray('─'.repeat(60)));

    this.currentPlan.steps.forEach((step, index) => {
      const statusIcon = this.getStatusIcon(step.status);
      const statusColor = this.getStatusColor(step.status);
      
      console.log(`${statusIcon} ${statusColor(`${index + 1}. ${step.description}`)}`);
      if (step.result) {
        console.log(chalk.gray(`   └─ ${step.result.substring(0, 80)}${step.result.length > 80 ? '...' : ''}`));
      }
    });

    console.log(chalk.gray('─'.repeat(60)) + '\n');
  }

  public displayThinking(thinking: string, stream = false): void {
    if (stream) {
      if (this.thinkingBuffer.length === 0) {
        console.log('\n' + chalk.bgMagenta.white.bold(' 🧠 РАЗМЫШЛЕНИЕ АГЕНТА '));
        console.log(chalk.gray('─'.repeat(60)));
      }
      
      if (thinking.length > this.thinkingBuffer.length) {
        const newContent = thinking.substring(this.thinkingBuffer.length);
        process.stdout.write(chalk.cyan(newContent));
        this.thinkingBuffer = thinking;
      }
    } else {
      console.log('\n' + chalk.bgMagenta.white.bold(' 🧠 РАЗМЫШЛЕНИЕ АГЕНТА '));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.cyan(thinking));
      console.log(chalk.gray('─'.repeat(60)) + '\n');
      this.thinkingBuffer = thinking;
    }
  }

  public finishThinking(): void {
    if (this.thinkingBuffer.length > 0) {
      console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
      this.thinkingBuffer = '';
    }
  }

  public displayReasoning(reasoning: string): void {
    console.log('\n' + chalk.bgCyan.black.bold(' 💡 РАССУЖДЕНИЕ ') + '\n');
    console.log(chalk.white(reasoning));
    console.log(chalk.gray('─'.repeat(60)) + '\n');
  }

  public addActionToHistory(item: ActionHistoryItem): void {
    this.actionHistory.push(item);
  }

  public displayActionHistory(lastN = 10): void {
    const recentActions = this.actionHistory.slice(-lastN);
    
    console.log('\n' + chalk.bgGreen.black.bold(' 📜 ИСТОРИЯ ДЕЙСТВИЙ ') + '\n');
    
    recentActions.forEach((action, index) => {
      const statusIcon = action.status === 'success' ? chalk.green('✓') : chalk.red('✗');
      const time = action.timestamp.toLocaleTimeString('ru-RU');
      
      console.log(`${chalk.gray(`[${action.iteration}]`)} ${statusIcon} ${chalk.cyan(action.tool)}`);
      console.log(chalk.gray(`   ⏰ ${time}`));
      console.log(chalk.gray(`   📥 Аргументы: ${JSON.stringify(action.args).substring(0, 60)}...`));
      console.log(chalk.gray(`   📤 Результат: ${action.result.substring(0, 80)}${action.result.length > 80 ? '...' : ''}`));
      
      if (index < recentActions.length - 1) {
        console.log(chalk.gray('   ↓'));
      }
    });
    
    console.log('\n' + chalk.gray('─'.repeat(60)));
  }

  public displayCurrentStep(iteration: number, tool: string, args: Record<string, unknown>): void {
    console.log('\n' + chalk.bgYellow.black.bold(` ⚙️  ШАГ ${iteration} `) + '\n');
    console.log(chalk.yellow(`🔧 Инструмент: ${chalk.bold(tool)}`));
    console.log(chalk.yellow(`📋 Параметры:`));
    
    Object.entries(args).forEach(([key, value]) => {
      const displayValue = typeof value === 'string' && value.length > 50
        ? `${value.substring(0, 50)}...`
        : JSON.stringify(value);
      console.log(chalk.gray(`   ${key}: ${displayValue}`));
    });
    
    console.log();
  }

  public displayStepResult(result: string, status: 'success' | 'failed'): void {
    const color = status === 'success' ? chalk.green : chalk.red;
    const label = status === 'success' ? '✓ Результат' : '✗ Ошибка';
    
    const displayResult = result.length > 200 ? `${result.substring(0, 200)}...` : result;
    console.log(color(`${label}:`));
    console.log(chalk.white(`   ${displayResult}`));
    console.log(chalk.gray('─'.repeat(60)) + '\n');
  }

  public displayIterationSummary(iteration: number, maxIterations: number): void {
    console.log(chalk.magenta(`\n━━━ Итерация ${iteration}/${maxIterations} ━━━\n`));
  }

  public displayTaskCompletion(success: boolean, summary: string): void {
    if (success) {
      console.log('\n' + chalk.bgGreen.white.bold(' ✅ ЗАДАЧА ВЫПОЛНЕНА '));
      console.log(chalk.green('\n📋 Итог:'));
      console.log(chalk.white(`   ${summary}`));
    } else {
      console.log('\n' + chalk.bgRed.white.bold(' ❌ ЗАДАЧА НЕ ВЫПОЛНЕНА '));
      console.log(chalk.red('\n📋 Причина:'));
      console.log(chalk.white(`   ${summary}`));
    }
    
    console.log('\n' + chalk.gray('═'.repeat(60)));
  }

  private getStatusIcon(status: TaskStepStatus): string {
    const icons: Record<TaskStepStatus, string> = {
      pending: '⏸️',
      in_progress: '▶️',
      completed: '✅',
      failed: '❌',
      skipped: '⏭️',
    };
    return icons[status];
  }

  private getStatusColor(status: TaskStepStatus): (text: string) => string {
    const colors: Record<TaskStepStatus, (text: string) => string> = {
      pending: chalk.gray,
      in_progress: chalk.yellow,
      completed: chalk.green,
      failed: chalk.red,
      skipped: chalk.blue,
    };
    return colors[status];
  }

  public reset(): void {
    this.currentPlan = null;
    this.actionHistory = [];
    this.thinkingBuffer = '';
  }
}

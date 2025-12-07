import chalk from 'chalk';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type ColorFunction = (text: string) => string;

class Logger {
  private level: LogLevel = 'info';

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  private log(level: LogLevel, message: string, color: ColorFunction): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log(`${chalk.gray(timestamp)} ${color(level.toUpperCase())}: ${message}`);
  }

  public info(message: string): void {
    this.log('info', message, chalk.blue);
  }

  public warn(message: string): void {
    this.log('warn', message, chalk.yellow);
  }

  public error(message: string): void {
    this.log('error', message, chalk.red);
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.level === 'debug') {
      this.log('debug', message, chalk.gray);
      if (args.length > 0) {
        console.log(chalk.gray(JSON.stringify(args)));
      }
    }
  }
}

export const logger = new Logger();

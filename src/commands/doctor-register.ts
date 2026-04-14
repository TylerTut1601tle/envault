import { Command } from 'commander';
import { runDoctor, formatDoctorResult } from './doctor';

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Check the health of the envault setup in the current directory')
    .action(async () => {
      const cwd = process.cwd();
      try {
        const result = await runDoctor(cwd);
        console.log(formatDoctorResult(result));
        if (!result.allOk) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error('doctor failed:', err.message);
        process.exit(1);
      }
    });
}

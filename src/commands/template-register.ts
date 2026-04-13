import { Command } from 'commander';
import { runTemplate } from './template';
import { resolvePassword } from '../cli';

export function registerTemplateCommand(program: Command): void {
  program
    .command('template <vault> <templateFile>')
    .description('Render a template file using decrypted env variables from a vault')
    .option('-o, --output <file>', 'Output file path (default: stdout)')
    .option('-p, --password <password>', 'Encryption password')
    .option('--env-file <file>', 'Path to .env file', '.env')
    .action(async (vault: string, templateFile: string, opts: {
      output?: string;
      password?: string;
      envFile: string;
    }) => {
      const password = await resolvePassword(opts.password);
      const result = await runTemplate({
        vault,
        templateFile,
        output: opts.output,
        password,
        envFile: opts.envFile,
      });
      if (!result.success) {
        console.error(result.message);
        process.exit(1);
      }
      console.log(result.message);
    });
}

import { Command } from 'commander';
import { convertEnvFile, formatConvertResult, ConvertFormat } from './convert';

const VALID_FORMATS: ConvertFormat[] = ['dotenv', 'json', 'yaml', 'export'];

export function registerConvertCommand(program: Command): void {
  program
    .command('convert <input> <output>')
    .description('Convert an env file to another format (dotenv, json, yaml, export)')
    .option('-f, --format <format>', 'output format: dotenv | json | yaml | export', 'json')
    .action(async (input: string, output: string, opts: { format: string }) => {
      const fmt = opts.format as ConvertFormat;
      if (!VALID_FORMATS.includes(fmt)) {
        console.error(`✗ Invalid format "${fmt}". Choose from: ${VALID_FORMATS.join(', ')}`);
        process.exit(1);
      }
      const result = await convertEnvFile(input, output, fmt);
      console.log(formatConvertResult(result));
      if (!result.success) process.exit(1);
    });
}

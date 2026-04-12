#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { parseEnvFile, serializeEnvFile } from './env/parser';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('envault')
  .description('Manage and encrypt local .env files with team-sharing support')
  .version('0.1.0');

program
  .command('parse <file>')
  .description('Parse and display an .env file as structured JSON')
  .option('-o, --output <path>', 'Write output to a file instead of stdout')
  .action((file: string, options: { output?: string }) => {
    const filePath = path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseEnvFile(raw);
    const json = JSON.stringify(parsed, null, 2);

    if (options.output) {
      const outPath = path.resolve(process.cwd(), options.output);
      fs.writeFileSync(outPath, json, 'utf-8');
      console.log(chalk.green(`Parsed env written to ${outPath}`));
    } else {
      console.log(json);
    }
  });

program
  .command('serialize <jsonFile>')
  .description('Convert a JSON env object back to .env format')
  .option('-o, --output <path>', 'Write output to a file')
  .action((jsonFile: string, options: { output?: string }) => {
    const filePath = path.resolve(process.cwd(), jsonFile);

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, string>;
    const serialized = serializeEnvFile(data);

    if (options.output) {
      const outPath = path.resolve(process.cwd(), options.output);
      fs.writeFileSync(outPath, serialized, 'utf-8');
      console.log(chalk.green(`Serialized env written to ${outPath}`));
    } else {
      console.log(serialized);
    }
  });

program.parse(process.argv);

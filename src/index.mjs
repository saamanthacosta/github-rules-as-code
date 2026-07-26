import { Command } from 'commander';
import { planCommand } from './commands/plan.mjs';
import { applyCommand } from './commands/apply.mjs';

const program = new Command();

program
  .name('github-rules-as-code')
  .description('Manifest-driven GitHub ruleset + CODEOWNERS applicator')
  .version('0.1.0');

program
  .command('plan')
  .description('Compute the diff between desired and current state, log it, exit 0.')
  .option('-r, --repo <owner/name>', 'Limit the plan to a single repo')
  .option('--prune', 'Include deletions in the plan (default: false)', false)
  .action(async (opts) => {
    await planCommand(opts);
  });

program
  .command('apply')
  .description('Apply the diff between desired and current state.')
  .option('-r, --repo <owner/name>', 'Limit the apply to a single repo')
  .option('--prune', 'Allow deletions (required for removals)', false)
  .action(async (opts) => {
    await applyCommand(opts);
  });

await program.parseAsync(process.argv);

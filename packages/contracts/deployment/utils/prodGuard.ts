import { execSync } from 'child_process';
import * as readline from 'readline';

export async function assertProductionBranch(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;

  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

  if (branch !== 'main') {
    console.warn('\n⚠️  WARNING: You are deploying to PRODUCTION from branch "%s" (not main)\n', branch);

    const confirmed = await promptConfirm('Are you sure you want to continue? (y/N): ');
    if (!confirmed) {
      console.log('Deployment aborted.');
      process.exit(1);
    }
    console.log();
  }
}

function promptConfirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

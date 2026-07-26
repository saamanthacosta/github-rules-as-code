import { spawn } from 'node:child_process';

function run(args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      const out = Buffer.concat(stdout).toString('utf8');
      const err = Buffer.concat(stderr).toString('utf8');
      if (code !== 0) {
        const error = new Error(`gh ${args.join(' ')} exited ${code}: ${err}`);
        error.stdout = out;
        error.stderr = err;
        error.code = code;
        reject(error);
        return;
      }
      resolve(out);
    });
    if (input !== undefined) {
      child.stdin.end(input);
    } else {
      child.stdin.end();
    }
  });
}

export async function ghApi(method, path, { body, headers } = {}) {
  const args = ['api', path, '--method', method];
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      args.push('--header', `${k}: ${v}`);
    }
  }
  if (body !== undefined) {
    args.push('--input', '-');
  }
  const input = body !== undefined ? JSON.stringify(body) : undefined;
  const stdout = await run(args, { input });
  return stdout ? JSON.parse(stdout) : null;
}

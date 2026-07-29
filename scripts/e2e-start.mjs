import { spawn } from 'node:child_process';

const port = process.env.PORT ?? '3100';
let child;

function run(args) {
  return spawn(process.execPath, ['node_modules/next/dist/bin/next', ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
}

const stop = (signal) => {
  if (child && !child.killed) child.kill(signal);
};

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));

const build = run(['build']);
child = build;
build.once('exit', (code) => {
  if (code !== 0) {
    process.exitCode = code ?? 1;
    return;
  }
  child = run(['start', '--hostname', '127.0.0.1', '--port', port]);
  child.once('exit', (serverCode) => {
    process.exitCode = serverCode ?? 0;
  });
});

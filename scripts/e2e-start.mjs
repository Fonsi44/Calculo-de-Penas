#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT ?? '3100';
const JWT_SECRET = process.env.PWT_JWT_SECRET ?? process.env.JWT_SECRET ?? 'e2e-test-jwt-secret-not-for-production-48-bytes-X7q9Zk-real-random';
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
{
  const url = new URL(DATABASE_URL);
  const host = url.hostname.toLowerCase();
  const dbName = url.pathname.replace(/^\//, '').toLowerCase();
  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const namedTest = /(^|[-_])test([-_]|$)|_test$|test_/.test(dbName);
  if (!local && !namedTest) throw new Error('DATABASE_URL de E2E no es una base aislada autorizada');
}

const env = {
  ...process.env,
  NODE_ENV: 'production',
  JWT_SECRET,
  DATABASE_URL,
  ALLOW_TEST_EMAILS: 'true',
  DISABLE_RATE_LIMIT: 'true',
  NEXT_TELEMETRY_DISABLED: '1',
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env, shell: true });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`)));
  });
}

await run('npm', ['run', 'build']);
await run('npx', ['next', 'start', '-p', PORT]);

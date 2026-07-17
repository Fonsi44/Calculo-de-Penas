import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const WINDOWS_FALLBACK = 'C:\\gcloud-sdk\\google-cloud-sdk\\bin\\gcloud.cmd';
const CODEX_PYTHON_FALLBACK = 'C:\\Users\\Admin\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';

function resolveGcloudPython() {
  if (process.env.CLOUDSDK_PYTHON && fs.existsSync(process.env.CLOUDSDK_PYTHON)) {
    return process.env.CLOUDSDK_PYTHON;
  }
  return process.platform === 'win32' && fs.existsSync(CODEX_PYTHON_FALLBACK)
    ? CODEX_PYTHON_FALLBACK
    : null;
}

export function resolveGcloudCli() {
  const configured = process.env.GCLOUD_CLI_PATH;
  if (configured && fs.existsSync(configured)) return configured;
  if (process.platform === 'win32' && fs.existsSync(WINDOWS_FALLBACK)) return WINDOWS_FALLBACK;
  const probe = spawnSync('gcloud', ['version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
  return probe.status === 0 ? 'gcloud' : null;
}

export function runGcloud(args, { inherit = false } = {}) {
  const cli = resolveGcloudCli();
  if (!cli) return { ok: false, stdout: '', stderr: 'gcloud no encontrado' };
  const env = { ...process.env };
  const python = resolveGcloudPython();
  if (python) env.CLOUDSDK_PYTHON = python;
  const windowsCmd = process.platform === 'win32' && cli.toLowerCase().endsWith('.cmd');
  const command = windowsCmd ? 'cmd.exe' : cli;
  const commandArgs = windowsCmd ? ['/d', '/s', '/c', cli, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    env,
    encoding: inherit ? undefined : 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
    windowsHide: true,
  });
  const stdout = inherit ? '' : String(result.stdout || '').trim();
  const stderr = inherit ? '' : String(result.stderr || '').trim();
  const pythonMissing = /must have Python installed|CLOUDSDK_PYTHON/i.test(`${stdout}\n${stderr}`);
  return {
    ok: result.status === 0 && !pythonMissing,
    stdout,
    stderr,
  };
}

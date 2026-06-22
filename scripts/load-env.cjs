#!/usr/bin/env node
// Wrapper que carga variables desde .env del proyecto y luego lanza el comando pasado.
// Uso:
//   node scripts/load-env.cjs <comando> [args...]
// Comportamiento:
//   - Lee .env desde CWD (o DOTENV_PATH si está definido) si existe.
//   - Solo exporta variables que NO estén ya en process.env (no sobrescribe).
//   - Expande placeholders ${VAR} en los argumentos antes de invocar el subproceso.
//   - Propaga todo el entorno al subproceso y devuelve su exit code.

const fs = require("fs");
const path = require("path");

function loadDotenv(envPath) {
  if (!fs.existsSync(envPath)) return 0;
  const content = fs.readFileSync(envPath, "utf8");
  let loaded = 0;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded += 1;
    }
  }
  return loaded;
}

// Mapeo de nombres de variable alternativos para compatibilidad con MCP servers
const VAR_MAP = {
  GITHUB_PERSONAL_ACCESS_TOKEN: 'GITHUB_TOKEN',
};
for (const [src, dst] of Object.entries(VAR_MAP)) {
  if (process.env[src] !== undefined && process.env[dst] === undefined) {
    process.env[dst] = process.env[src];
  }
}

function expandVars(arg) {
  return arg.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, name) => {
    const v = process.env[name];
    if (v === undefined) {
      process.stderr.write(
        `[load-env] placeholder \${${name}} no encontrado en el entorno\n`,
      );
      return "";
    }
    return v;
  });
}

const cwdEnvPath = path.join(process.cwd(), ".env");
const overrideEnvPath = process.env.DOTENV_PATH;
const envPath = overrideEnvPath ? path.resolve(overrideEnvPath) : cwdEnvPath;

const loaded = loadDotenv(envPath);
if (process.env.LOAD_ENV_DEBUG === "1") {
  process.stderr.write(
    `[load-env] archivo=${envPath} cargadas=${loaded} ya_presentes_en_shell=${
      Object.keys(process.env).length
    }\n`,
  );
}

const args = process.argv.slice(2);
if (args.length === 0) {
  process.stderr.write(
    "load-env.cjs: falta comando. Uso: node load-env.cjs <comando> [args...]\n",
  );
  process.exit(2);
}

const expanded = args.map(expandVars);
const [cmd, ...cmdArgs] = expanded;

const { spawn } = require("child_process");
// En Windows muchos binarios (npx, npm) son .cmd y requieren cmd.exe
// para resolverse correctamente desde spawn; usamos shell:true solo alli.
const isWindows = process.platform === "win32";
const child = spawn(cmd, cmdArgs, {
  stdio: "inherit",
  env: process.env,
  windowsHide: true,
  shell: isWindows,
});

child.on("error", (err) => {
  process.stderr.write(
    `[load-env] no se pudo arrancar ${cmd}: ${err.message}\n`,
  );
  process.exit(127);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

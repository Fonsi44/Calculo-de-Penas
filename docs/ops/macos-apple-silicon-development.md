# Desarrollo en macOS Apple Silicon

Guía para configurar y trabajar con el proyecto en MacBook Pro con chip M1/M2/M3/M4.

## Requisitos

- macOS 15+ (Sequoia)
- Arquitectura arm64 (Apple Silicon)
- Xcode Command Line Tools

## Instalación rápida

```bash
# 1. Xcode CLT (instala git, clang, make)
xcode-select --install

# 2. Homebrew (opcional pero recomendado)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"

# 3. fnm (gestor de versiones Node)
brew install fnm
# Alternativa sin Homebrew:
# curl -fsSL https://fnm.vercel.app/install | bash

# 4. Configurar shell (~/.zshrc)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc
exec zsh

# 5. Node (versión >=22 requerida)
fnm install 22
fnm use 22
node --version  # debe ser arm64

# 6. Dependencias
cd "/Users/fonsi/Documents/Justicia Verdadera"
npm ci

# 7. Copiar archivos .env desde el backup seguro o el administrador
```

## Comando diario para trabajar

```bash
cd "/Users/fonsi/Documents/Justicia Verdadera"
export PATH="$HOME/.local/bin:$PATH"
eval "$(fnm env --shell zsh)"
fnm use
npm run dev
```

## Variables de entorno

Los archivos `.env`, `.env.local` y `.env.vercel` contienen las credenciales
reales. **NUNCA** se commitean. El repositorio solo incluye `.env.example`
como plantilla.

Si necesitas regenerar las variables:

1. Solicita `.env.local` al administrador.
2. Colócalo en la raíz del proyecto con permisos `600`.
3. Verifica que `.gitignore` lo excluye.

## Versiones del proyecto

| Herramienta | Versión |
|---|---|
| Node | >= 22 (arm64) |
| npm | >= 11 |
| Next.js | 16.2.10 |
| React | 19.2.7 |
| TypeScript | ^5 |

## CLIs

| CLI | Instalación | Autenticación |
|---|---|---|
| **Vercel CLI** | `npm install -g vercel` | `VERCEL_TOKEN` en `.env` |
| **Neon CLI** | `npm install -g neonctl` | `NEON_API_KEY` en `.env.local` |
| **GitHub CLI** | `brew install gh` o binario oficial | `gh auth login` (navegador + Keychain) |

## Dependencias nativas en Apple Silicon

Las siguientes dependencias requieren compilación nativa. Están verificadas
para arm64:

| Paquete | Estado | Notas |
|---|---|---|
| sharp | arm64 nativo | Procesamiento de imágenes |
| esbuild | arm64 nativo | Bundler |
| libxmljs2 | arm64 nativo | Parseo XML |
| tesseract.js | arm64 nativo | OCR |

npm >= 11 requiere `allowScripts` en `package.json` para que estos paquetes
ejecuten sus scripts de instalación. El proyecto ya incluye esta configuración.

## Validaciones

```bash
npm test              # Vitest (66 files, 1235+ tests)
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript
npm run build         # Next.js build
npx drizzle-kit check  # Verificar conexión Neon
```

## Migraciones (Neon)

```bash
# Verificar estado
npx drizzle-kit check

# Generar migraciones (tras cambios en schema.ts)
npx drizzle-kit generate

# Aplicar migraciones
npx drizzle-kit push
```

**NUNCA usar producción.** Usar siempre la base de desarrollo o una rama
Neon efímera.

## Solución de errores comunes

### `exec format error` en binarios
El binario no es arm64. Verificar con `file <binario>`. Descargar la versión
arm64/macOS en lugar de la Linux.

### `DATABASE_URL environment variable is required`
Las variables `.env` no se cargaron. Verificar que `.env.local` existe y
`npm run dev` usa Next.js que carga dotenv automáticamente.

### `Module not found: @/lib/google-reviews`
El stub de compatibilidad (`lib/google-reviews.ts`) provee fallback local.
Si `GOOGLE_PLACES_API_KEY` está configurada, las reseñas reales se obtienen
automáticamente.

### npm bloquea `install scripts`
npm >= 11 requiere aprobación explícita. El `package.json` ya incluye
`allowScripts`. Si añades nuevas dependencias nativas, agrégalas allí.

## Historial de adaptación macOS

| Commit | Cambio |
|---|---|
| `5a1a51a1` | Añadido `allowScripts` para módulos nativos y stub `lib/google-reviews.ts` |
| `c19f6574` | Corrección de lint `react-hooks/set-state-in-effect` |

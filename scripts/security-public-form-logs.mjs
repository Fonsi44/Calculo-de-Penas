import { readFileSync } from 'node:fs';

const PRODUCT_FILES = [
  'app/api/consulta/route.ts',
  'app/api/contacto/route.ts',
  'app/api/email/inbound/route.ts',
  'app/api/whatsapp/route.ts',
  'lib/email.ts',
  'lib/captcha.ts',
  'components/marketing/solicitar-consulta-form.tsx',
  'lib/analytics.ts',
];

const LOG_LEAK_PATTERNS = [
  { name: 'parsed_data', re: /console\.(?:log|info|warn|error|debug)[\s\S]{0,180}parsed\.data/gi },
  { name: 'raw_email_error', re: /console\.(?:log|info|warn|error|debug)[^\n]*(?:result\.error|autoResult\.error|errorMsg)/gi },
  { name: 'raw_exception_message', re: /console\.(?:log|info|warn|error|debug)[^\n]*(?:\.message|instanceof Error)/gi },
  { name: 'provider_object', re: /console\.(?:log|info|warn|error|debug)[^\n]*(?:fwdError|error de API|JSON\.stringify\(msg\))/gi },
  { name: 'recipient_or_subject', re: /console\.(?:log|info|warn|error|debug)[^\n]*(?:fromEmail|recipientAddress|allRecipients|data\.subject)/gi },
  { name: 'request_headers', re: /console\.(?:log|info|warn|error|debug)[\s\S]{0,180}request\.headers/gi },
  { name: 'captcha_token', re: /console\.(?:log|info|warn|error|debug)[^\n]*(?:turnstileToken|cf-turnstile-response|error-codes)/gi },
];

const RESPONSE_LEAK_PATTERNS = [
  { name: 'raw_provider_response', re: /Response\.json\([\s\S]{0,160}(?:result\.error|autoResult\.error|errorMsg|e\.message)/gi },
  { name: 'stack_response', re: /Response\.json\([\s\S]{0,160}\.stack/gi },
];

const ANALYTICS_CALL_PATTERN =
  /track(?:ContactFormSubmit|ConsultationFormError)\(\{[^}]*\b(?:nombre|telefono|email|resumen|mensaje|localidad|fechaAudiencia|fechaDespido|hayDetencion)\s*:/gi;

const findings = [];
for (const file of PRODUCT_FILES) {
  const source = readFileSync(file, 'utf8');
  for (const pattern of [...LOG_LEAK_PATTERNS, ...RESPONSE_LEAK_PATTERNS]) {
    pattern.re.lastIndex = 0;
    for (const match of source.matchAll(pattern.re)) {
      const line = source.slice(0, match.index).split('\n').length;
      findings.push(`${file}:${line} ${pattern.name}`);
    }
  }
  if (file.endsWith('solicitar-consulta-form.tsx')) {
    ANALYTICS_CALL_PATTERN.lastIndex = 0;
    for (const match of source.matchAll(ANALYTICS_CALL_PATTERN)) {
      const line = source.slice(0, match.index).split('\n').length;
      findings.push(`${file}:${line} analytics_pii`);
    }
  }
}

if (findings.length > 0) {
  console.error('Public form log security scan failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Public form log security scan passed (${PRODUCT_FILES.length} production files).`);

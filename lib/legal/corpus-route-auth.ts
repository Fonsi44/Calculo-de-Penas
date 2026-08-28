import {
  apiKeyNotConfiguredResponse,
  apiKeyUnauthorizedResponse,
  verifyApiKey,
} from '@/lib/api-key-auth';

const ENV_VAR = 'LEGAL_CORPUS_API_KEY';

export function requireLegalCorpusApiKey(request: Request): Response | null {
  if (!process.env.LEGAL_CORPUS_API_KEY?.trim()) {
    return apiKeyNotConfiguredResponse();
  }
  if (!verifyApiKey(request, ENV_VAR)) {
    return apiKeyUnauthorizedResponse();
  }
  return null;
}

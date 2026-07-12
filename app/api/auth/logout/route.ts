import { createLogoutResponse, getTokenFromCookies, verifyToken, invalidateFreshness } from '@/lib/auth';

export async function POST(request: Request) {
  const token = getTokenFromCookies(request);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      invalidateFreshness(payload.userId);
    }
  }
  return createLogoutResponse();
}

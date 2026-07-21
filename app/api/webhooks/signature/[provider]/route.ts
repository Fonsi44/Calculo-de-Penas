import { processWebhook, signatureServiceErrorResponse } from '@/lib/sgie/signature-service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const rawBody = await req.text();
    const headers: Record<string, string | string[] | undefined> = {};
    req.headers.forEach((val, key) => { headers[key] = val; });

    const result = await processWebhook({ rawBody, headers, provider });
    return Response.json(result);
  } catch (e) {
    return signatureServiceErrorResponse(e);
  }
}

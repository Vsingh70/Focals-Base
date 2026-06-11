type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();

// In-memory limiter: only effective on a single long-lived server. On
// serverless/multi-instance deploys, swap the Map for Upstash Redis
// (@upstash/ratelimit) keeping rateLimit()'s signature unchanged.
export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const hit = buckets.get(key);
  if (!hit || now > hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (hit.count >= limit) return false;
  hit.count += 1;
  return true;
}

export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') ?? '0.0.0.0';
}

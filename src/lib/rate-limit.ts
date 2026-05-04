type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

let lastCleanup = 0;

function cleanup() {
  const now = Date.now();

  if (now - lastCleanup < 60_000) return;

  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  cleanup();

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;

  return entry.count > limit;
}

export function checkRateLimit(
  request: Request,
  limit: number,
  windowMs: number,
): { allowed: boolean; ip: string } {
  const ip = getClientIp(request);
  const key = `${ip}:${Math.floor(Date.now() / windowMs)}`;

  return {
    allowed: !isRateLimited(key, limit, windowMs),
    ip,
  };
}

export function clearRateLimitStore() {
  store.clear();
}

export interface OrderUpdateEvent {
  orderId: string;
  status: string;
  vendorUserId?: string;
  customerUserId?: string;
  driverUserId?: string;
  timestamp: string;
}

export interface NotificationEvent {
  userId: string;
  title: string;
  message: string;
  type: string;
}

/** Derive Socket.IO base URL from REST API URL (strips /api/v1). */
export function getRealtimeBaseUrl(apiUrl: string): string {
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

export function getUserIdFromToken(token: string): string | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof atob !== 'undefined'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

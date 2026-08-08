import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(token: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<{
      success: boolean;
      data: NotificationItem[];
      unreadCount: number;
    }>('/notifications?unreadOnly=false', {}, token);
    setNotifications(response.data);
    setUnreadCount(response.unreadCount);
  }, [token]);

  useEffect(() => {
    refresh().catch(() => null);
    if (!token) return;
    const interval = setInterval(() => {
      refresh().catch(() => null);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, refresh]);

  const markAllRead = async () => {
    if (!token) return;
    await apiRequest('/notifications/read-all', { method: 'PATCH' }, token);
    await refresh();
  };

  return { unreadCount, notifications, refresh, markAllRead };
}

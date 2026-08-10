import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import type { NotificationEvent, OrderUpdateEvent } from '@kasieats/shared';
import { getRealtimeBaseUrl, getUserIdFromToken } from '@kasieats/shared';
import { API_URL } from '../services/api';
import { registerPushToken } from '../services/push';
import { useAuth } from './AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type OrderHandler = (event: OrderUpdateEvent) => void;
type NotificationHandler = (event: NotificationEvent) => void;

interface RealtimeContextValue {
  connected: boolean;
  onOrderUpdate: (handler: OrderHandler) => () => void;
  onNotification: (handler: NotificationHandler) => () => void;
  watchOrder: (orderId: string | null) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

async function showLocalNotification(event: NotificationEvent) {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: { title: event.title, body: event.message },
    trigger: null,
  });
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const userId = useMemo(() => (token ? getUserIdFromToken(token) : null), [token]);
  const socketRef = useRef<Socket | null>(null);
  const orderHandlers = useRef(new Set<OrderHandler>());
  const notificationHandlers = useRef(new Set<NotificationHandler>());
  const watchedOrderRef = useRef<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.requestPermissionsAsync().catch(() => null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      registerPushToken(token).catch(() => null);
    }
  }, [token]);

  const emitSubscribe = useCallback(
    (socket: Socket) => {
      if (!userId) return;
      socket.emit('subscribe', { userId, orderId: watchedOrderRef.current ?? undefined });
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(`${getRealtimeBaseUrl(API_URL)}/orders`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      emitSubscribe(socket);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('order:update', (event: OrderUpdateEvent) => {
      orderHandlers.current.forEach((handler) => handler(event));
    });
    socket.on('notification:new', (event: NotificationEvent) => {
      showLocalNotification(event).catch(() => null);
      notificationHandlers.current.forEach((handler) => handler(event));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [userId, emitSubscribe]);

  const watchOrder = useCallback(
    (orderId: string | null) => {
      watchedOrderRef.current = orderId;
      if (socketRef.current) emitSubscribe(socketRef.current);
    },
    [emitSubscribe],
  );

  const value = useMemo(
    () => ({
      connected,
      onOrderUpdate: (handler: OrderHandler) => {
        orderHandlers.current.add(handler);
        return () => orderHandlers.current.delete(handler);
      },
      onNotification: (handler: NotificationHandler) => {
        notificationHandlers.current.add(handler);
        return () => notificationHandlers.current.delete(handler);
      },
      watchOrder,
    }),
    [connected, watchOrder],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

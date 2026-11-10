"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { AppNotification } from "@/types";
import { useAuth } from "./auth-context";

type NotificationContextValue = {
  unread: number;
  notifications: AppNotification[];
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const seenIds = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [list, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationsCount(),
      ]);
      seenIds.current = new Set(list.map((n) => n.id));
      setNotifications(list);
      setUnread(count?.count ?? 0);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      if (alive) await refresh();
    })();
    return () => {
      alive = false;
    };
  }, [token, refresh]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket();

    const onNotification = (notification: unknown) => {
      const n = notification as AppNotification;
      if (seenIds.current.has(n.id)) return;
      seenIds.current.add(n.id);
      setNotifications((prev) => [n, ...prev].slice(0, 100));
      setUnread((prev) => prev + 1);
    };

    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
    }
  }, [token]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  const value = useMemo(
    () => ({ unread, notifications, refresh, markRead, markAllRead }),
    [unread, notifications, refresh, markRead, markAllRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}
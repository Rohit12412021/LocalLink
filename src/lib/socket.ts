"use client";

import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";

let socket: Socket | null = null;

export type SocketEvents = {
  notification: (notification: unknown) => void;
  chat_message: (message: unknown) => void;
  booking_updated: (payload: { requestId: string; status: string }) => void;
};

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getApiBaseUrl(), {
      auth: {
        token: getToken(),
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (s.disconnected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
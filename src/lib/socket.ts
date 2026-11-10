"use client";

import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getApiBaseUrl(), {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

/** Call this after login/token change so socket uses fresh token */
export function refreshSocketToken(): void {
  if (socket) {
    socket.auth = { token: getToken() };
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (s.disconnected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

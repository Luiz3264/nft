import type { Socket } from "socket.io-client";

let socket: Socket | undefined;

export async function connectRealtime() {
  if (!socket) {
    // Load Socket.IO only after MSW installs its WebSocket interceptor.
    const { io } = await import("socket.io-client");
    socket = io(window.location.origin, {
      path: "/socket.io/",
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 2_000,
    });
  }
  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = undefined;
}

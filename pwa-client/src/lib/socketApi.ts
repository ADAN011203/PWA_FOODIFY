import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

const SOCKET_URL = "http://3.142.73.52:3000";

class SocketManager {
  private sockets: Map<string, Socket> = new Map();

  getSocket(namespace: string = "/"): Socket {
    if (this.sockets.has(namespace)) {
      return this.sockets.get(namespace)!;
    }

    const token = useAuthStore.getState().token;
    
    const socket = io(`${SOCKET_URL}${namespace}`, {
      auth: { token: `Bearer ${token}` },
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log(`Connected to Socket.io [${namespace}]`);
    });

    socket.on("connect_error", (error: any) => {
      console.error(`Socket connection error [${namespace}]:`, error);
    });

    this.sockets.set(namespace, socket);
    return socket;
  }

  disconnectAll() {
    this.sockets.forEach((s) => s.disconnect());
    this.sockets.clear();
  }
}

export const socketManager = new SocketManager();

// Specific Namespace getters
export const getKitchenSocket = () => socketManager.getSocket("/kitchen");
export const getRestaurantSocket = () => socketManager.getSocket("/restaurant");
export const getGeneralSocket = () => socketManager.getSocket("/");

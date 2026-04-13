import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

// Use relative path to hit the Next.js rewrite /api_proxy in production to avoid Mixed Content
const SOCKET_URL = "/api_proxy";

class SocketManager {
  private sockets: Map<string, Socket> = new Map();

  getSocket(namespace: string = "/"): Socket {
    if (this.sockets.has(namespace)) {
      return this.sockets.get(namespace)!;
    }

    const token = useAuthStore.getState().token;
    
    const socket = io(namespace, {
      path: "/api_proxy/socket.io/",
      auth: { token: `Bearer ${token}` },
      transports: ["polling"],
      upgrade: false,
      multiplex: true,
      withCredentials: true,
      forceNew: false, // Share the manager across namespaces
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
      randomizationFactor: 0.5,
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

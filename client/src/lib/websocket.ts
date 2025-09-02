// WebSocket client for real-time communication
import { create } from 'zustand';

// WebSocket connection status type
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// WebSocket store interface
interface WebSocketStore {
  socket: WebSocket | null;
  status: ConnectionStatus;
  lastMessage: any | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
}

// Create WebSocket store
export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  status: 'disconnected',
  lastMessage: null,
  
  connect: () => {
    // Don't reconnect if already connected or connecting
    if (get().status === 'connected' || get().status === 'connecting') {
      return;
    }
    
    try {
      set({ status: 'connecting' });
      
      // Determine WebSocket URL based on current protocol and host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket server at ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      
      // Event handlers
      socket.onopen = () => {
        console.log('WebSocket connection established');
        set({ status: 'connected', socket });
        
        // Send initial ping message
        socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          set({ lastMessage: message });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        set({ status: 'disconnected', socket: null });
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          get().connect();
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't set disconnected here - wait for onclose event
      };
      
      set({ socket });
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      set({ status: 'disconnected', socket: null });
    }
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      console.log('Closing WebSocket connection');
      socket.close();
      set({ status: 'disconnected', socket: null });
    }
  },
  
  sendMessage: (message: any) => {
    const { socket, status } = get();
    if (socket && status === 'connected') {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('Cannot send message - WebSocket is not connected');
    }
  }
}));

// Hook for WebSocket functionality
export function useWebSocket() {
  return useWebSocketStore();
}

// Function to initialize WebSocket connection
export function initializeWebSocketConnection() {
  useWebSocketStore.getState().connect();
}
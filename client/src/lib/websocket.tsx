import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebSocketContextType {
  connected: boolean;
  send: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  send: () => {},
});

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    // Connection opened
    ws.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setConnected(true);
    });
    
    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    });
    
    // Connection closed
    ws.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    });
    
    // Connection error
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    });
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);
  
  const send = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };
  
  return (
    <WebSocketContext.Provider value={{ connected, send }}>
      {children}
    </WebSocketContext.Provider>
  );
};
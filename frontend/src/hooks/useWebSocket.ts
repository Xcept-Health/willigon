import { useEffect, useRef, useCallback, useState } from "react";
import type { BPMData } from "../types/rppg";

type WSStatus = "connecting" | "open" | "closed" | "error";

interface UseWebSocketReturn {
  send: (data: string) => void;
  lastMessage: BPMData | null;
  status: WSStatus;
}

const RECONNECT_DELAY = 2000;

export function useWebSocket(url: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<BPMData | null>(null);
  const [status, setStatus] = useState<WSStatus>("connecting");
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      if (mountedRef.current) setStatus("open");
    };

    ws.onmessage = (ev) => {
      try {
        const data: BPMData = JSON.parse(ev.data);
        if (mountedRef.current) setLastMessage(data);
      } catch {
        // ignore malformed message
      }
    };

    ws.onerror = () => {
      if (mountedRef.current) setStatus("error");
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("closed");
      // Reconnexion automatique
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const send = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  return { send, lastMessage, status };
}

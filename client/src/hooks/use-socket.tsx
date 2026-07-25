import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSocket, type AppSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';

interface SocketContextValue {
  socket: AppSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setSocket((prev) => {
        if (prev) {
          prev.removeAllListeners();
          prev.disconnect();
        }
        return null;
      });
      setIsConnected(false);
      return;
    }

    const next = createSocket(accessToken);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    next.on('connect', handleConnect);
    next.on('disconnect', handleDisconnect);

    setSocket(next);

    return () => {
      next.off('connect', handleConnect);
      next.off('disconnect', handleDisconnect);
      next.removeAllListeners();
      next.disconnect();
    };
  }, [accessToken, isAuthenticated]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [socket, isConnected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}

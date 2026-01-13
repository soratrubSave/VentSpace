import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import type { Topic } from '../types';

export const useSocket = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize userId - Each browser/device gets unique ID
    let storedId = localStorage.getItem('vent_user_id');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('vent_user_id', storedId);
    }
    setUserId(storedId);

    // Connect Socket
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(apiUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('load_topics', (data: Topic[]) => {
      setTopics(data);
      setIsLoading(false);
    });

    socket.on('new_topic', (topic: Topic) => {
      setTopics(prev => [topic, ...prev]);
      setError(null);
    });

    socket.on('update_topic', (updatedTopic: Topic) => {
      setTopics(prev => {
        // Handle deleted topics
        if ((updatedTopic as any).deleted) {
          return prev.filter(t => t._id !== (updatedTopic as any)._id);
        }
        // Update existing topic or add new one
        const existingIndex = prev.findIndex(t => t._id === updatedTopic._id);
        if (existingIndex !== -1) {
          return prev.map(t => t._id === updatedTopic._id ? updatedTopic : t);
        }
        return prev;
      });
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event as any, data);
    }
  };

  return {
    topics,
    setTopics,
    userId,
    isLoading,
    isConnected,
    error,
    emit
  };
};

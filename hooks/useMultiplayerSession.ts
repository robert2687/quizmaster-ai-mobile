import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export type Mode = 'menu' | 'host-setup' | 'join-input' | 'lobby' | 'playing' | 'results';

export function useMultiplayerSession() {
  const { activeProfile } = useApp();
  const [mode, setMode] = useState<Mode>('menu');
  const [topic, setTopic] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const modeRef = useRef<Mode>('menu');

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const refreshSession = useCallback(async (sessionId: string) => {
    try {
      const data = await api.getSession(sessionId);
      setSession(data);
      if (data.status === 'in_progress' && modeRef.current === 'lobby') {
        const qs = (data.quiz?.questions || [])
          .sort((a: any, b: any) => a.ord - b.ord)
          .map((q: any) => ({
            id: q.id,
            question: q.text,
            options: q.answers?.map((a: any) => a.text) || [],
            correctAnswer: q.answers?.find((a: any) => a.is_correct)?.text || '',
            answers: q.answers,
          }));
        setQuizQuestions(qs);
        setMode('playing');
      }
      if (data.status === 'finished') {
        setResults(data.players || []);
        setMode('results');
        channelRef.current?.unsubscribe();
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (session?.id && (mode === 'lobby' || mode === 'playing')) {
      channelRef.current?.unsubscribe();
      const channel = supabase
        .channel(`session:${session.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        }, () => refreshSession(session.id))
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'session_players',
          filter: `session_id=eq.${session.id}`,
        }, () => refreshSession(session.id))
        .subscribe();
      channelRef.current = channel;
      return () => { channel.unsubscribe(); };
    }
  }, [session?.id, mode, refreshSession]);

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  const handleHost = async () => {
    if (!activeProfile) { setError('Select a profile first'); return; }
    if (!topic.trim()) { setError('Enter a topic'); return; }
    setLoading(true);
    setError('');
    try {
      const s = await api.createSession(topic, activeProfile.id, 10);
      const full = await api.getSession(s.id);
      setSession(full);
      setMode('lobby');
    } catch (e: any) {
      setError(e.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!activeProfile) { setError('Select a profile first'); return; }
    if (joinCode.length !== 6) { setError('Enter a valid 6-character code'); return; }
    setLoading(true);
    setError('');
    try {
      const s = await api.joinSession(joinCode.toUpperCase(), activeProfile.id);
      const full = await api.getSession(s.id);
      setSession(full);
      setMode('lobby');
    } catch (e: any) {
      setError(e.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await api.startSession(session.id);
      const full = await api.getSession(session.id);
      const qs = (full.quiz?.questions || [])
        .sort((a: any, b: any) => a.ord - b.ord)
        .map((q: any) => ({
          id: q.id,
          question: q.text,
          options: q.answers?.map((a: any) => a.text) || [],
          correctAnswer: q.answers?.find((a: any) => a.is_correct)?.text || '',
          answers: q.answers,
        }));
      setQuizQuestions(qs);
      setSession(full);
      setMode('playing');
    } catch (e: any) {
      setError(e.message || 'Failed to start game');
    }
  };

  const handleAnswer = async (questionId: string, answer: string, q: any) => {
    if (!activeProfile || !session) return;
    const matchingAnswer = (q as any).answers?.find((a: any) => a.text === answer);
    if (matchingAnswer) {
      try {
        await api.submitAnswer(session.id, activeProfile.id, questionId, matchingAnswer.id);
      } catch { }
    }
  };

  const handleQuizComplete = async (score: number, answered: any[]) => {
    if (!session || !activeProfile) return;
    const isHost = session.players?.find((p: any) => p.profile_id === activeProfile.id)?.is_host;
    if (isHost) {
      try {
        const res = await api.endSession(session.id);
        setResults(res.leaderboard || []);
      } catch { }
    }
    setMode('results');
    channelRef.current?.unsubscribe();
  };

  const reset = () => {
    channelRef.current?.unsubscribe();
    setMode('menu');
    setSession(null);
    setTopic('');
    setJoinCode('');
    setQuizQuestions([]);
    setResults([]);
    setError('');
  };

  return {
    mode,
    setMode,
    topic,
    setTopic,
    joinCode,
    setJoinCode,
    session,
    loading,
    error,
    setError,
    quizQuestions,
    results,
    handleHost,
    handleJoin,
    handleStart,
    handleAnswer,
    handleQuizComplete,
    reset,
    activeProfile
  };
}

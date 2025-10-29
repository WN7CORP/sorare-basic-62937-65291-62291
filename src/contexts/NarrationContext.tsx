import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface NarrationState {
  currentAudioUrl: string | null;
  isPlaying: boolean;
  progress: number;
  articleNumber: string | null;
}

interface NarrationContextType {
  narrationState: NarrationState;
  playNarration: (audioUrl: string, articleNumber: string) => void;
  pauseNarration: () => void;
  stopNarration: () => void;
}

const NarrationContext = createContext<NarrationContextType | undefined>(undefined);

export const NarrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [narrationState, setNarrationState] = useState<NarrationState>({
    currentAudioUrl: null,
    isPlaying: false,
    progress: 0,
    articleNumber: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const stopNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setNarrationState({
      currentAudioUrl: null,
      isPlaying: false,
      progress: 0,
      articleNumber: null,
    });
  }, []);

  const pauseNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setNarrationState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const playNarration = useCallback((audioUrl: string, articleNumber: string) => {
    // Se já está tocando o mesmo áudio, apenas pausa
    if (narrationState.currentAudioUrl === audioUrl && narrationState.isPlaying) {
      pauseNarration();
      return;
    }

    // Se já está tocando o mesmo áudio mas pausado, retoma
    if (narrationState.currentAudioUrl === audioUrl && !narrationState.isPlaying && audioRef.current) {
      audioRef.current.play();
      setNarrationState(prev => ({ ...prev, isPlaying: true }));
      
      // Reinicia o intervalo de progresso
      progressIntervalRef.current = window.setInterval(() => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setNarrationState(prev => ({ ...prev, progress }));
        }
      }, 100);
      return;
    }

    // Para o áudio atual se houver
    stopNarration();

    // Cria novo áudio
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    setNarrationState({
      currentAudioUrl: audioUrl,
      isPlaying: true,
      progress: 0,
      articleNumber,
    });

    audio.play();

    // Atualiza o progresso
    progressIntervalRef.current = window.setInterval(() => {
      if (audio && !audio.paused) {
        const progress = (audio.currentTime / audio.duration) * 100;
        setNarrationState(prev => ({ ...prev, progress }));
      }
    }, 100);

    // Quando o áudio termina
    audio.onended = () => {
      stopNarration();
    };

    // Se houver erro
    audio.onerror = () => {
      console.error('Erro ao reproduzir áudio');
      stopNarration();
    };
  }, [narrationState, pauseNarration, stopNarration]);

  return (
    <NarrationContext.Provider value={{ narrationState, playNarration, pauseNarration, stopNarration }}>
      {children}
    </NarrationContext.Provider>
  );
};

export const useNarration = () => {
  const context = useContext(NarrationContext);
  if (!context) {
    throw new Error('useNarration must be used within NarrationProvider');
  }
  return context;
};

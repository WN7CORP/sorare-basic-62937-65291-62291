import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const hapticPatterns = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  error: [20, 100, 20, 100, 20],
  selection: [5]
};

export const useHaptic = () => {
  const vibrate = useCallback((pattern: HapticPattern) => {
    // Verificar se a API de vibração está disponível
    if (!navigator.vibrate) return;
    
    // Verificar se o usuário está em um dispositivo móvel
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const vibrationPattern = hapticPatterns[pattern];
    navigator.vibrate(vibrationPattern);
  }, []);

  return {
    light: () => vibrate('light'),
    medium: () => vibrate('medium'),
    heavy: () => vibrate('heavy'),
    success: () => vibrate('success'),
    error: () => vibrate('error'),
    selection: () => vibrate('selection')
  };
};

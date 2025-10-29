import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions: Record<string, number> = {};

export const useScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Salvar posição atual antes de sair
    const saveScrollPosition = () => {
      scrollPositions[location.pathname] = window.scrollY;
    };

    // Restaurar posição ao entrar
    const savedPosition = scrollPositions[location.pathname];
    if (savedPosition !== undefined) {
      window.scrollTo(0, savedPosition);
    }

    // Adicionar listener para salvar ao rolar
    window.addEventListener('scroll', saveScrollPosition);

    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
      saveScrollPosition();
    };
  }, [location.pathname]);
};

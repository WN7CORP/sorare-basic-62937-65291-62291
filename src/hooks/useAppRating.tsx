import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type DeviceType = "ios" | "android";

export const useAppRating = () => {
  const [shouldShowRating, setShouldShowRating] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("android");
  const [isChecking, setIsChecking] = useState(true);
  const [userIp, setUserIp] = useState<string>("");

  // Detectar se é mobile ou tablet
  const isMobileOrTablet = (): boolean => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 1024;
    
    return (isMobile || isTablet || hasTouch) && isSmallScreen;
  };

  // Detectar tipo de dispositivo
  const detectDevice = (): DeviceType => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return "ios";
    }
    return "android";
  };

  // Obter IP do usuário
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Erro ao obter IP:", error);
      // Fallback: usar um identificador alternativo
      return `fallback-${Date.now()}`;
    }
  };

  // Verificar se deve mostrar o modal
  const checkIfShouldShow = async () => {
    try {
      // Verificar se é mobile ou tablet
      if (!isMobileOrTablet()) {
        setIsChecking(false);
        return;
      }

      const ip = await getUserIP();
      setUserIp(ip);
      
      const device = detectDevice();
      setDeviceType(device);

      const { data, error } = await supabase.functions.invoke("gerenciar-rating", {
        body: {
          userIp: ip,
          action: "check",
          deviceType: device,
        },
      });

      if (error) {
        console.error("Erro ao verificar rating:", error);
        setIsChecking(false);
        return;
      }

      if (data?.shouldShow) {
        // Aguardar 3 segundos antes de mostrar o modal
        setTimeout(() => {
          setShouldShowRating(true);
          setIsChecking(false);
        }, 3000);
      } else {
        setIsChecking(false);
      }
    } catch (error) {
      console.error("Erro ao verificar exibição do rating:", error);
      setIsChecking(false);
    }
  };

  // Usuário clicou em "Avaliar"
  const handleRated = async () => {
    try {
      await supabase.functions.invoke("gerenciar-rating", {
        body: {
          userIp,
          action: "rated",
        },
      });

      // Redirecionar para a loja apropriada
      const storeUrl =
        deviceType === "ios"
          ? "https://apps.apple.com/us/app/direito-premium/id6451451647"
          : "https://play.google.com/store/apps/details?id=br.com.app.gpu2994564.gpub492f9e6db037057aaa93d7adfa9e3e0";

      window.open(storeUrl, "_blank");
      setShouldShowRating(false);
    } catch (error) {
      console.error("Erro ao marcar como avaliado:", error);
    }
  };

  // Usuário clicou em "Depois"
  const handlePostpone = async () => {
    try {
      await supabase.functions.invoke("gerenciar-rating", {
        body: {
          userIp,
          action: "postpone",
        },
      });

      setShouldShowRating(false);
    } catch (error) {
      console.error("Erro ao adiar rating:", error);
      setShouldShowRating(false);
    }
  };

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  return {
    shouldShowRating,
    deviceType,
    isChecking,
    handleRated,
    handlePostpone,
  };
};

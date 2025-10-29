import { toast } from "sonner";

export const toastHelpers = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description
    });
  },

  favoritoAdicionado: (nome: string, onDesfazer?: () => void) => {
    toast.success("❤️ Favoritado!", {
      description: `${nome} foi adicionado aos favoritos`,
      action: onDesfazer ? {
        label: "Desfazer",
        onClick: onDesfazer
      } : undefined
    });
  },

  marcacaoAdicionada: (nome: string, onDesfazer?: () => void) => {
    toast.success("🔖 Marcado!", {
      description: `${nome} foi marcado`,
      action: onDesfazer ? {
        label: "Desfazer",
        onClick: onDesfazer
      } : undefined
    });
  },

  resultadoDisponivel: (onVer?: () => void) => {
    toast.success("🎉 Resultado pronto!", {
      description: "Seu resultado está disponível",
      action: onVer ? {
        label: "Ver resultado",
        onClick: onVer
      } : undefined
    });
  }
};

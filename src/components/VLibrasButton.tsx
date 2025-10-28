import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Accessibility } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const VLibrasButton = () => {
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  // Ocultar VLibras ao carregar a página
  useEffect(() => {
    const vlibrasWidget = document.querySelector('[vw]') as HTMLElement;
    if (vlibrasWidget) {
      vlibrasWidget.style.display = 'none';
    }
  }, []);

  const toggleVLibras = () => {
    const vlibrasWidget = document.querySelector('[vw]') as HTMLElement;
    const vlibrasButton = document.querySelector('[vw-access-button]') as HTMLElement;
    
    if (vlibrasWidget && vlibrasButton) {
      if (isActive) {
        vlibrasWidget.style.display = 'none';
        setIsActive(false);
        toast({
          title: "VLibras desativado",
          description: "O tradutor de Libras foi ocultado.",
        });
      } else {
        vlibrasWidget.style.display = 'block';
        setIsActive(true);
        toast({
          title: "VLibras ativado",
          description: "Use o botão azul para ativar o tradutor de Libras.",
        });
      }
    }
  };

  return (
    <Button
      onClick={toggleVLibras}
      size="icon"
      variant="ghost"
      className={`h-9 w-9 transition-all hover:scale-110 ${
        isActive 
          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
          : 'bg-muted/60 hover:bg-muted border border-border'
      }`}
      title="Ativar/Desativar VLibras"
    >
      <Accessibility className="w-4 h-4" />
    </Button>
  );
};

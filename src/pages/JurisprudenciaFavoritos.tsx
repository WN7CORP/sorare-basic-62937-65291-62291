import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { JurisprudenciaCard } from "@/components/JurisprudenciaCard";

interface Jurisprudencia {
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
  temaJuridico?: string;
}

const JurisprudenciaFavoritos = () => {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState<Jurisprudencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para ver seus favoritos",
        variant: "destructive",
      });
      navigate("/jurisprudencia");
      return;
    }

    setUser(user);
    loadFavoritos(user.id);
  };

  const loadFavoritos = async (userId: string) => {
    setIsLoading(true);
    try {
      // Tabela temporariamente desabilitada
      setFavoritos([]);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus favoritos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerDetalhes = (juris: Jurisprudencia) => {
    navigate(`/jurisprudencia/detalhes/${encodeURIComponent(juris.numeroProcesso)}`, {
      state: { jurisprudencia: juris }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b border-border bg-card/95 backdrop-blur-lg px-3 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/jurisprudencia")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              <Star className="w-4 h-4 fill-current" />
              Meus Favoritos
            </h1>
            {!isLoading && <p className="text-xs text-muted-foreground">{favoritos.length} jurisprudências salvas</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando favoritos...</p>
          </div>
        ) : favoritos.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Você ainda não tem favoritos</p>
            <Button onClick={() => navigate("/jurisprudencia")}>
              Buscar Jurisprudências
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {favoritos.map((juris, index) => (
              <JurisprudenciaCard
                key={index}
                jurisprudencia={juris}
                onVerDetalhes={() => handleVerDetalhes(juris)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JurisprudenciaFavoritos;

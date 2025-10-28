import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart, Share2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ContentGenerationLoader } from "./ContentGenerationLoader";

interface WikipediaArtigoProps {
  titulo: string;
  categoria: string;
}

interface Artigo {
  titulo: string;
  conteudo: string;
  html: string;
  imagens: string[];
  links_relacionados: string[];
}

export const WikipediaArtigo = ({ titulo, categoria }: WikipediaArtigoProps) => {
  const [artigo, setArtigo] = useState<Artigo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorito, setIsFavorito] = useState(false);

  useEffect(() => {
    carregarArtigo();
    verificarFavorito();
  }, [titulo]);

  const carregarArtigo = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('buscar-artigo-wikipedia', {
        body: {
          action: 'article',
          titulo,
          categoria
        }
      });

      if (error) throw error;

      setArtigo(data);
    } catch (error) {
      console.error('Erro ao carregar artigo:', error);
      toast.error('Erro ao carregar artigo');
    } finally {
      setLoading(false);
    }
  };

  const verificarFavorito = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('wikipedia_favoritos')
        .select('id')
        .eq('user_id', user.id)
        .eq('titulo', titulo)
        .single();

      setIsFavorito(!!data);
    } catch (error) {
      // Não é favorito
    }
  };

  const toggleFavorito = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Faça login para adicionar favoritos');
        return;
      }

      if (isFavorito) {
        await supabase
          .from('wikipedia_favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('titulo', titulo);
        
        setIsFavorito(false);
        toast.success('Removido dos favoritos');
      } else {
        await supabase
          .from('wikipedia_favoritos')
          .insert({
            user_id: user.id,
            titulo,
            categoria
          });
        
        setIsFavorito(true);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Erro ao gerenciar favorito:', error);
      toast.error('Erro ao gerenciar favorito');
    }
  };

  const compartilhar = async () => {
    const url = `https://pt.wikipedia.org/wiki/${encodeURIComponent(titulo)}`;
    const texto = `📚 ${titulo} - Wikipedia`;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
      } catch (error) {
        // Usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  if (loading) {
    return <ContentGenerationLoader message="Carregando artigo..." />;
  }

  if (!artigo) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Artigo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{artigo.titulo}</h1>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFavorito}
            className={isFavorito ? "text-red-500 border-red-500" : ""}
          >
            <Heart className={`w-4 h-4 mr-2 ${isFavorito ? "fill-current" : ""}`} />
            {isFavorito ? "Favoritado" : "Favoritar"}
          </Button>
          
          <Button variant="outline" size="sm" onClick={compartilhar}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://pt.wikipedia.org/wiki/${encodeURIComponent(titulo)}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Wikipedia
          </Button>
        </div>
      </div>

      {/* Imagem principal */}
      {artigo.imagens.length > 0 && (
        <div className="mb-6">
          <img
            src={artigo.imagens[0]}
            alt={artigo.titulo}
            className="w-full rounded-lg shadow-lg max-h-[400px] object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Conteúdo */}
      <div 
        className="prose prose-sm md:prose-base max-w-none"
        dangerouslySetInnerHTML={{ __html: artigo.html }}
      />

      {/* Links relacionados */}
      {artigo.links_relacionados.length > 0 && (
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-bold mb-3">📖 Artigos Relacionados</h3>
          <div className="flex flex-wrap gap-2">
            {artigo.links_relacionados.map((link) => (
              <Button
                key={link}
                variant="secondary"
                size="sm"
                onClick={() => window.location.href = `/meu-brasil/artigo/${encodeURIComponent(link)}`}
              >
                {link}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

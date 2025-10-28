import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BlogArtigoModal } from "@/components/BlogArtigoModal";
import { BookOpen } from "lucide-react";

interface ArtigoBlog {
  "Nº": number;
  "Título": string;
  "Capa": string;
  "Link": string;
  artigo_melhorado?: string;
}

export default function EstagiosBlog() {
  const [artigos, setArtigos] = useState<ArtigoBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [artigoSelecionado, setArtigoSelecionado] = useState<ArtigoBlog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchArtigos();
  }, []);

  const fetchArtigos = async () => {
    try {
      const { data, error } = await supabase
        .from('ESTAGIO-BLOG')
        .select('*')
        .order('Nº', { ascending: false });

      if (error) throw error;
      setArtigos(data || []);
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
      toast.error("Erro ao carregar artigos");
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirArtigo = (artigo: ArtigoBlog) => {
    setArtigoSelecionado(artigo);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Blog de Estágios</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dicas, orientações e insights valiosos para estudantes de Direito em busca de estágios
          </p>
        </div>

        {/* Lista de artigos - Layout compacto */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  <Skeleton className="h-32 w-48 flex-shrink-0 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </Card>
            ))
          ) : artigos.length > 0 ? (
            artigos.map((artigo, index) => (
              <Card 
                key={artigo['Nº']} 
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleAbrirArtigo(artigo)}
              >
                <div className="flex flex-col md:flex-row gap-4 p-4">
                  {/* Conteúdo - esquerda */}
                  <div className="flex-1 space-y-3 order-2 md:order-1">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                      {artigo['Título']}
                    </h3>
                    {artigo.artigo_melhorado && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {artigo.artigo_melhorado.substring(0, 200)}...
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-fit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirArtigo(artigo);
                      }}
                    >
                      {artigo.artigo_melhorado ? 'Ler artigo completo' : 'Gerar e ler artigo'}
                    </Button>
                  </div>
                  
                  {/* Imagem - direita */}
                  {artigo['Capa'] && (
                    <div className="relative w-full md:w-48 h-32 overflow-hidden rounded flex-shrink-0 order-1 md:order-2">
                      <img 
                        src={artigo['Capa']} 
                        alt={artigo['Título']}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum artigo disponível</h3>
              <p className="text-muted-foreground">
                Novos artigos serão adicionados em breve
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de artigo */}
      {artigoSelecionado && (
        <BlogArtigoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          numero={artigoSelecionado['Nº']}
          titulo={artigoSelecionado['Título']}
          capa={artigoSelecionado['Capa']}
          linkOriginal={artigoSelecionado['Link']}
        />
      )}
    </div>
  );
}
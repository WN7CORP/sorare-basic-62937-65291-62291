import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NoticiaCard from "@/components/NoticiaCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Newspaper } from "lucide-react";
interface Noticia {
  id: string;
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
}
const NoticiasJuridicas = () => {
  const navigate = useNavigate();
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const categorias = ["Todas", "Direito", "Concursos", "OAB", "Investimentos"];
  const {
    data: noticias,
    isLoading,
    error
  } = useQuery({
    queryKey: ['noticias-juridicas'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('buscar-noticias-juridicas');
      if (error) throw error;
      return data as Noticia[];
    },
    staleTime: 5 * 60 * 1000 // Cache de 5 minutos
  });
  const noticiasFiltradas = categoriaAtiva === "Todas" ? noticias : noticias?.filter(n => n.categoria === categoriaAtiva);
  const handleNoticiaClick = (noticia: Noticia) => {
    navigate(`/noticias-juridicas/${noticia.id}`, {
      state: {
        noticia
      }
    });
  };
  return <div className="min-h-screen pb-20 bg-background">
      {/* Header com introdução */}
      <div className="bg-primary px-4 py-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Jurídico em Pauta</h1>
          </div>
          <p className="text-primary-foreground/90 text-sm">
            Acompanhe as principais notícias do mundo jurídico
          </p>
        </div>
      </div>

      {/* Menu de Categorias */}
      <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categorias.map(categoria => <Button key={categoria} onClick={() => setCategoriaAtiva(categoria)} variant={categoriaAtiva === categoria ? "default" : "outline"} size="sm" className={`whitespace-nowrap ${categoriaAtiva === categoria ? "" : "hover:bg-primary/10"}`}>
                {categoria}
              </Button>)}
          </div>
        </div>
      </div>

      {/* Lista de Notícias */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-2">Erro ao carregar notícias</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Tente novamente mais tarde"}
            </p>
          </div>}

        {isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>)}
          </div>}

        {!isLoading && !error && noticiasFiltradas && noticiasFiltradas.length === 0 && <div className="text-center py-12">
            <Newspaper className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              Nenhuma notícia encontrada nesta categoria
            </p>
          </div>}

        {!isLoading && !error && noticiasFiltradas && noticiasFiltradas.length > 0 && <>
            <div className="mb-4 text-sm text-muted-foreground">
              {noticiasFiltradas.length} {noticiasFiltradas.length === 1 ? 'notícia encontrada' : 'notícias encontradas'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {noticiasFiltradas.map(noticia => <NoticiaCard key={noticia.id} {...noticia} onClick={() => handleNoticiaClick(noticia)} />)}
            </div>
          </>}
      </div>
    </div>;
};
export default NoticiasJuridicas;
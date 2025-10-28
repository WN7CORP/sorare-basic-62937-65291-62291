import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedNews {
  id: string;
  titulo: string;
  descricao: string;
  link: string;
  imagem?: string;
  data: string;
  analise?: string; // Análise já gerada pela IA
  fonte?: string; // Portal/fonte da notícia
  categoria_tipo?: string; // Tipo/categoria da notícia
}

const CACHE_KEY = 'featured_news_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

export const useFeaturedNews = () => {
  const [featuredNews, setFeaturedNews] = useState<FeaturedNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedNews();
  }, []);

  const loadFeaturedNews = async () => {
    try {
      // Verificar cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0 && Date.now() - timestamp < CACHE_DURATION) {
          setFeaturedNews(data);
          setLoading(false);
          return;
        }
      }

      // Buscar notícias
      const news = await fetchNews();
      
      // Salvar no cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: news,
        timestamp: Date.now()
      }));

      setFeaturedNews(news);
    } catch (error) {
      console.error('Erro ao carregar notícias em destaque:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async (): Promise<FeaturedNews[]> => {
    try {
      // Buscar as 5 notícias mais recentes
      const { data, error } = await supabase
        .from('noticias_juridicas_cache')
        .select('*')
        .order('data_publicacao', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Transformar no formato esperado
      return (data || []).map((noticia: any) => ({
        id: noticia.id,
        titulo: noticia.titulo,
        descricao: noticia.descricao || noticia.fonte || '',
        link: noticia.link,
        imagem: noticia.imagem,
        data: noticia.data_publicacao,
        analise: noticia.analise_ia, // Incluir análise se disponível
        fonte: noticia.fonte || 'Portal Jurídico',
        categoria_tipo: noticia.categoria_tipo || noticia.categoria || 'Geral'
      }));
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      return [];
    }
  };

  return { featuredNews, loading, reload: loadFeaturedNews };
};

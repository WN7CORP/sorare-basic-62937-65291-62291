import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

// Keywords jurídicas para descoberta
const LEGAL_KEYWORDS = [
  'lawyer', 'attorney', 'court', 'justice', 'legal', 'trial',
  'judge', 'lawsuit', 'verdict', 'law', 'criminal', 'defense',
  'prosecutor', 'jury', 'litigation', 'advocate'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, year_from, year_to, min_rating, media_type } = await req.json();

    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const searchKeywords = keywords || LEGAL_KEYWORDS;
    const mediaTypes = media_type ? [media_type] : ['movie', 'tv'];
    const minRating = min_rating || 7.0;
    
    const yearFrom = year_from || 1950;
    const yearTo = year_to || new Date().getFullYear();

    console.log(`Buscando títulos jurídicos: ${searchKeywords.join(', ')}`);

    const allResults = [];

    for (const type of mediaTypes) {
      for (const keyword of searchKeywords.slice(0, 3)) { // Limitar para não exceder rate limits
        const discoverUrl = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=vote_average.desc&vote_count.gte=100&vote_average.gte=${minRating}&with_keywords=${keyword}&primary_release_date.gte=${yearFrom}-01-01&primary_release_date.lte=${yearTo}-12-31&page=1`;
        
        try {
          const response = await fetch(discoverUrl);
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            allResults.push(...data.results.slice(0, 5).map((item: any) => ({
              tmdb_id: item.id,
              tipo: type,
              titulo: item.title || item.name,
              titulo_original: item.original_title || item.original_name,
              ano: type === 'movie' 
                ? item.release_date?.substring(0, 4) 
                : item.first_air_date?.substring(0, 4),
              sinopse: item.overview,
              nota: item.vote_average,
              votos: item.vote_count,
              popularidade: item.popularity,
              poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
              backdrop: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : null,
              keyword_encontrada: keyword
            })));
          }
        } catch (err) {
          console.error(`Erro ao buscar com keyword ${keyword}:`, err);
        }
      }
    }

    // Remover duplicados e ordenar por nota
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.tmdb_id, item])).values()
    ).sort((a, b) => b.nota - a.nota);

    console.log(`Encontrados ${uniqueResults.length} títulos jurídicos`);

    return new Response(
      JSON.stringify({
        success: true,
        total: uniqueResults.length,
        titulos: uniqueResults.slice(0, 20) // Top 20
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em buscar-titulos-juridicos-tmdb:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
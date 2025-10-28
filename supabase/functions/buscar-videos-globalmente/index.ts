import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();
    
    if (!searchTerm || searchTerm.length < 3) {
      return new Response(
        JSON.stringify({ videos: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Buscando vídeos globalmente com termo:", searchTerm);

    // Buscar diretamente na nova tabela com thumbnails já incluídas
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const searchLower = searchTerm.toLowerCase();

    // Buscar TODOS os vídeos sem limite
    const { data: videos, error: dbError } = await supabaseClient
      .from("VIDEO AULAS-NOVO")
      .select("*")
      .range(0, 10000); // Limite aumentado para 10000 vídeos

    if (dbError) throw dbError;

    console.log(`Encontrados ${videos?.length || 0} vídeos no banco`);

    // Filtrar vídeos que correspondem ao termo de busca
    const matchingVideos = videos?.filter((video: any) => {
      const titulo = (video.titulo || '').toLowerCase();
      const area = (video.area || '').toLowerCase();
      const categoria = (video.categoria || '').toLowerCase();
      return titulo.includes(searchLower) || area.includes(searchLower) || categoria.includes(searchLower);
    }).map((video: any) => ({
      titulo: video.titulo,
      thumb: video.thumb,
      link: video.link,
      tempo: video.tempo,
      data: video.data,
      area: video.area,
      categoria: video.categoria,
    })) || [];

    console.log(`Total de vídeos encontrados: ${matchingVideos.length}`);

    return new Response(
      JSON.stringify({ videos: matchingVideos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Erro na função buscar-videos-globalmente:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

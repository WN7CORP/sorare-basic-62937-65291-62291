import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playlistLink } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    // Extrair ID da playlist do link
    const playlistId = extractPlaylistId(playlistLink);
    if (!playlistId) {
      throw new Error('Link de playlist inválido');
    }

    console.log('Buscando vídeos da playlist:', playlistId);

    // Buscar vídeos da playlist na API do YouTube
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${DIREITO_PREMIUM_API_KEY}`;
    
    const response = await fetch(playlistUrl);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro na API do YouTube:', errorData);
      throw new Error(`Erro ao buscar playlist: ${response.status}`);
    }

    const data = await response.json();
    
    // Formatar os vídeos
    const videos = data.items.map((item: any) => ({
      videoId: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));

    console.log(`${videos.length} vídeos encontrados`);

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função buscar-videos-playlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractPlaylistId(url: string): string | null {
  // Extrai o ID da playlist de um link padrão do YouTube
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}

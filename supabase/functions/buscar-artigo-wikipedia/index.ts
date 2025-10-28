import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

interface WikipediaArticle {
  titulo: string;
  conteudo: string;
  html: string;
  imagens: string[];
  links_relacionados: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, query, titulo, categoria } = await req.json();

    console.log('Wikipedia API Request:', { action, query, titulo, categoria });

    // Buscar artigos
    if (action === 'search') {
      const searchUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&list=search&srsearch=${encodeURIComponent(query)}` +
        `&format=json&utf8=1&srlimit=10`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      const results: WikipediaSearchResult[] = data.query?.search || [];

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter artigo completo
    if (action === 'article') {
      if (!titulo) {
        throw new Error('Título é obrigatório para buscar artigo');
      }

      // Verificar cache (válido por 7 dias)
      const { data: cached } = await supabase
        .from('wikipedia_cache')
        .select('*')
        .eq('titulo', titulo)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        console.log('Retornando artigo do cache:', titulo);
        
        // Registrar histórico (se tiver user_id no header)
        const authHeader = req.headers.get('Authorization');
        if (authHeader && categoria) {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            await supabase.from('wikipedia_historico').insert({
              user_id: user.id,
              titulo,
              categoria
            });
          }
        }

        return new Response(
          JSON.stringify(cached.conteudo),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar da Wikipedia
      console.log('Buscando artigo da Wikipedia:', titulo);

      // Obter conteúdo do artigo
      const articleUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(titulo)}` +
        `&prop=extracts|pageimages|links` +
        `&format=json&utf8=1` +
        `&explaintext=1&exintro=0` +
        `&piprop=original&pllimit=20`;

      const articleResponse = await fetch(articleUrl);
      const articleData = await articleResponse.json();

      const pages = articleData.query?.pages;
      const pageId = Object.keys(pages || {})[0];

      if (!pageId || pageId === '-1') {
        return new Response(
          JSON.stringify({ error: 'Artigo não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const page = pages[pageId];

      // Obter HTML do artigo
      const htmlUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=parse&page=${encodeURIComponent(titulo)}` +
        `&format=json&utf8=1&prop=text`;

      const htmlResponse = await fetch(htmlUrl);
      const htmlData = await htmlResponse.json();

      // Extrair imagens
      const imagens: string[] = [];
      if (page.original?.source) {
        imagens.push(page.original.source);
      }

      // Extrair links relacionados
      const links_relacionados: string[] = (page.links || [])
        .slice(0, 10)
        .map((link: any) => link.title);

      const article: WikipediaArticle = {
        titulo: page.title,
        conteudo: page.extract || '',
        html: htmlData.parse?.text?.['*'] || '',
        imagens,
        links_relacionados
      };

      // Salvar no cache
      await supabase.from('wikipedia_cache').upsert({
        titulo,
        conteudo: article,
        imagens,
        links_relacionados,
        updated_at: new Date().toISOString()
      });

      // Registrar histórico
      const authHeader = req.headers.get('Authorization');
      if (authHeader && categoria) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          await supabase.from('wikipedia_historico').insert({
            user_id: user.id,
            titulo,
            categoria
          });
        }
      }

      return new Response(
        JSON.stringify(article),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar imagens adicionais
    if (action === 'images') {
      if (!titulo) {
        throw new Error('Título é obrigatório para buscar imagens');
      }

      const imagesUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(titulo)}` +
        `&prop=images&format=json&utf8=1&imlimit=20`;

      const response = await fetch(imagesUrl);
      const data = await response.json();

      const pages = data.query?.pages;
      const pageId = Object.keys(pages || {})[0];
      const images = pages?.[pageId]?.images || [];

      return new Response(
        JSON.stringify({ images }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

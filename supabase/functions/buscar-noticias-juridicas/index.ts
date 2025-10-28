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
    const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    const SHEET_ID = '1tqCcr-HgmY5BMHBkLdSFaW2RoldSdFlM44Qx9xYWMLg';
    const RANGE = 'NOTICIAS'; // Nome da aba na planilha

    if (!GOOGLE_SHEETS_API_KEY) {
      throw new Error('GOOGLE_SHEETS_API_KEY não configurada');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    
    console.log('Buscando notícias do Google Sheets...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao buscar planilha:', errorText);
      throw new Error(`Erro ao buscar planilha: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.values || data.values.length < 2) {
      console.log('Nenhuma notícia encontrada');
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeira linha é o cabeçalho: Categoria, Portal, Título, Capa, Link, Data/Hora
    const rows = data.values.slice(1); // Pular cabeçalho
    
    const noticias = rows
      .filter((row: string[]) => row.length >= 5 && row[2] && row[4]) // Filtrar linhas válidas (mínimo: título e link)
      .map((row: string[], index: number) => ({
        id: `noticia-${index}`,
        categoria: row[0] || 'Geral',
        portal: row[1] || 'Portal Jurídico',
        titulo: row[2],
        capa: row[3] || '',
        link: row[4],
        dataHora: row[5] || new Date().toISOString(),
      }));

    console.log(`${noticias.length} notícias encontradas`);

    return new Response(
      JSON.stringify(noticias),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função buscar-noticias-juridicas:', error);
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

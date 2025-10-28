import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dados dos juristas a popular
const juristas = [
  // Históricos
  { nome: "Rui Barbosa", categoria: "historicos", periodo: "1849-1923", area: "Constitucionalista" },
  { nome: "Pontes de Miranda", categoria: "historicos", periodo: "1892-1979", area: "Civilista" },
  { nome: "Miguel Reale", categoria: "historicos", periodo: "1910-2006", area: "Filósofo do Direito" },
  { nome: "San Tiago Dantas", categoria: "historicos", periodo: "1911-1964", area: "Civilista" },
  { nome: "Clóvis Beviláqua", categoria: "historicos", periodo: "1859-1944", area: "Civilista" },
  { nome: "Sobral Pinto", categoria: "historicos", periodo: "1893-1991", area: "Advogado Criminalista" },
  { nome: "Evandro Lins e Silva", categoria: "historicos", periodo: "1912-2002", area: "Advogado Criminalista" },
  
  // Ministros STF
  { nome: "Luís Roberto Barroso", categoria: "ministrosSTF", periodo: "2013-Presente", area: "Presidente STF" },
  { nome: "Gilmar Mendes", categoria: "ministrosSTF", periodo: "2002-Presente", area: "Ministro STF" },
  { nome: "Dias Toffoli", categoria: "ministrosSTF", periodo: "2009-Presente", area: "Ministro STF" },
  { nome: "Carmen Lúcia", categoria: "ministrosSTF", periodo: "2006-Presente", area: "Ministra STF" },
  { nome: "Alexandre de Moraes", categoria: "ministrosSTF", periodo: "2017-Presente", area: "Ministro STF" },
  
  // Advogados
  { nome: "José Carlos Dias", categoria: "advogados", periodo: "1938-Presente", area: "Advogado Criminalista" },
  { nome: "Alberto Zacharias Toron", categoria: "advogados", periodo: "1944-Presente", area: "Advogado Criminalista" },
  
  // Professores
  { nome: "José Afonso da Silva", categoria: "professores", periodo: "1925-Presente", area: "Constitucionalista" },
  { nome: "Celso Antônio Bandeira de Mello", categoria: "professores", periodo: "1935-Presente", area: "Administrativista" },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tipo, limite } = await req.json();

    console.log('Populando Meu Brasil:', tipo, 'Limite:', limite || 'todos');

    let resultados: any[] = [];

    // Popular juristas
    if (tipo === 'juristas' || tipo === 'todos') {
      const juristasAProcesar = limite ? juristas.slice(0, limite) : juristas;
      
      for (const jurista of juristasAProcesar) {
        try {
          console.log(`Processando jurista: ${jurista.nome}`);

          // 1. Buscar da Wikipedia
          const wikiResponse = await fetch('https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-artigo-wikipedia', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              action: 'article',
              titulo: jurista.nome,
              categoria: 'jurista'
            }),
          });

          if (!wikiResponse.ok) {
            console.error(`Erro ao buscar ${jurista.nome}:`, await wikiResponse.text());
            continue;
          }

          const wikiData = await wikiResponse.json();

          // 2. Enriquecer com Gemini
          const enrichResponse = await fetch('https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/enriquecer-conteudo-meu-brasil', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              tipo: 'jurista',
              nome: jurista.nome,
              conteudo_original: wikiData,
              contexto: `${jurista.categoria} - ${jurista.periodo} - ${jurista.area}`
            }),
          });

          if (!enrichResponse.ok) {
            console.error(`Erro ao enriquecer ${jurista.nome}:`, await enrichResponse.text());
            continue;
          }

          const enrichData = await enrichResponse.json();

          // 3. Salvar no banco
          const { error } = await supabase
            .from('meu_brasil_juristas')
            .upsert({
              nome: jurista.nome,
              categoria: jurista.categoria,
              periodo: jurista.periodo,
              area: jurista.area,
              foto_url: wikiData.foto_url || wikiData.imagens?.[0] || null,
              conteudo_original: wikiData,
              conteudo_melhorado: enrichData.conteudo_melhorado,
              imagens: wikiData.imagens || [],
              links_relacionados: wikiData.links_relacionados || [],
            });

          if (error) {
            console.error(`Erro ao salvar ${jurista.nome}:`, error);
            continue;
          }

          resultados.push({ jurista: jurista.nome, sucesso: true });
          console.log(`✓ ${jurista.nome} processado com sucesso`);

          // Aguardar 2 segundos entre requisições para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Erro ao processar ${jurista.nome}:`, error);
          resultados.push({ 
            jurista: jurista.nome, 
            sucesso: false, 
            erro: error instanceof Error ? error.message : 'Erro desconhecido' 
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        total_processados: resultados.length,
        resultados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache (últimas 24 horas) - Retornar sempre que tiver >= 1 registro
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache_proposicoes_recentes')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('data_apresentacao', { ascending: false })
      .limit(15);

    if (!cacheError && cacheData && cacheData.length >= 1) {
      console.log('✅ Retornando do cache:', cacheData.length, 'proposições');
      return new Response(JSON.stringify({ proposicoes: cacheData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('⚡ Cache vazio, buscando da API...');

    // Buscar PLs recentes da API da Câmara
    const plsResponse = await fetch(
      'https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=PL&ordem=DESC&ordenarPor=id&itens=15',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!plsResponse.ok) {
      throw new Error('Erro ao buscar proposições da API');
    }

    const plsData = await plsResponse.json();
    const proposicoes = plsData.dados || [];

    console.log('Proposições encontradas:', proposicoes.length);

    const proposicoesProcessadas = [];

    for (const pl of proposicoes) {
      try {
        // Buscar detalhes da proposição
        const detalhesResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pl.id}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!detalhesResponse.ok) continue;
        
        const detalhes = await detalhesResponse.json();
        const propData = detalhes.dados;

        // Buscar autores
        const autoresResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pl.id}/autores`,
          { headers: { 'Accept': 'application/json' } }
        );

        let autorPrincipal = null;
        let fotoAutor = null;

        if (autoresResponse.ok) {
          const autoresData = await autoresResponse.json();
          const autores = autoresData.dados || [];
          
          // Pegar primeiro autor do tipo "Autor" ou o primeiro da lista
          autorPrincipal = autores.find((a: any) => a.tipo === 'Autor') || autores[0];
          
          console.log('Autor principal encontrado:', {
            nome: autorPrincipal?.nome,
            uri: autorPrincipal?.uri,
            codTipo: autorPrincipal?.codTipo,
            uriAutor: autorPrincipal?.uriAutor
          });

          if (autorPrincipal) {
            // Verificar se é um deputado (codTipo 1 ou 10000)
            const isDeputado = autorPrincipal.codTipo === 1 || autorPrincipal.codTipo === 10000;
            
            if (isDeputado) {
              try {
                // Extrair ID do deputado de múltiplas fontes
                let deputadoId = null;
                
                // Tentar extrair da URI
                if (autorPrincipal.uri) {
                  const match = autorPrincipal.uri.match(/\/deputados\/(\d+)/);
                  if (match) deputadoId = match[1];
                }
                
                // Se não encontrou, tentar do uriAutor
                if (!deputadoId && autorPrincipal.uriAutor) {
                  const match = autorPrincipal.uriAutor.match(/\/deputados\/(\d+)/);
                  if (match) deputadoId = match[1];
                }
                
                // Se não encontrou, tentar campo id direto
                if (!deputadoId && autorPrincipal.id) {
                  deputadoId = autorPrincipal.id.toString();
                }
                
                console.log('ID do deputado extraído:', deputadoId);
                
                if (deputadoId) {
                  // Buscar foto usando o MESMO método da função buscar-deputados (endpoint de listagem)
                  const nomeAutor = autorPrincipal.nome;
                  let fotoEncontrada: string | null = null;

                  try {
                    const buscaResponse = await fetch(
                      `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(nomeAutor)}&ordem=ASC&ordenarPor=nome`,
                      { headers: { 'Accept': 'application/json' } }
                    );

                    if (buscaResponse.ok) {
                      const buscaData = await buscaResponse.json();
                      if (buscaData.dados && buscaData.dados.length > 0) {
                        fotoEncontrada = buscaData.dados[0].urlFoto || null;
                      }
                    }
                  } catch (_e) {
                    // silencioso
                  }

                  if (!fotoEncontrada) {
                    // Fallback: buscar detalhes do deputado por ID e ler ultimoStatus.urlFoto
                    const deputadoResponse = await fetch(
                      `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputadoId}`,
                      { headers: { 'Accept': 'application/json' } }
                    );

                    if (deputadoResponse.ok) {
                      const deputadoData = await deputadoResponse.json();
                      fotoEncontrada = deputadoData.dados?.ultimoStatus?.urlFoto || deputadoData.dados?.urlFoto || null;
                    } else {
                      console.error('❌ Erro ao buscar deputado:', deputadoResponse.status);
                    }
                  }

                  fotoAutor = fotoEncontrada;
                  console.log('✅ Foto encontrada:', fotoAutor);
                } else {
                  console.warn('⚠️ Não foi possível extrair ID do deputado de nenhuma fonte');
                }
              } catch (fotoError) {
                console.error('❌ Erro ao buscar foto:', fotoError);
              }
            } else {
              console.log('⏭️ Autor não é deputado (codTipo:', autorPrincipal.codTipo, '), pulando busca de foto');
            }
          }
        }

        // Gerar título com IA
        let tituloGerado = null;
        const ementa = propData.ementa || pl.ementa;
        
        if (ementa) {
          try {
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'user',
                    content: `Você é um redator de títulos jornalísticos. Com base nesta ementa de projeto de lei:

"${ementa}"

Crie um título curto, claro e chamativo (máximo 80 caracteres) que explique de forma simples o que este projeto de lei pretende fazer. Use linguagem acessível como se estivesse escrevendo para um jornal. Apenas retorne o título, sem aspas ou formatação extra.`
                  }
                ],
                max_tokens: 100
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              tituloGerado = aiData.choices?.[0]?.message?.content?.trim();
            }
          } catch (aiError) {
            console.error('Erro ao gerar título com IA:', aiError);
          }
        }

        const proposicaoProcessada = {
          id_proposicao: pl.id,
          sigla_tipo: pl.siglaTipo,
          numero: pl.numero,
          ano: pl.ano,
          ementa: ementa,
          titulo_gerado_ia: tituloGerado,
          data_apresentacao: propData.dataApresentacao,
          autor_principal_id: autorPrincipal ? (
            autorPrincipal.uri?.split('/').pop() || 
            autorPrincipal.uriAutor?.split('/').pop()
          ) : null,
          autor_principal_nome: autorPrincipal?.nome,
          autor_principal_foto: fotoAutor,
          autor_principal_partido: autorPrincipal?.siglaPartido,
          autor_principal_uf: autorPrincipal?.siglaUf,
          url_inteiro_teor: propData.urlInteiroTeor,
          updated_at: new Date().toISOString()
        };
        
        console.log('Proposição processada:', {
          id: pl.id,
          titulo: tituloGerado?.substring(0, 50),
          autor: autorPrincipal?.nome,
          fotoUrl: fotoAutor ? 'SIM' : 'NÃO'
        });

        // Salvar/atualizar no banco
        const { error: upsertError } = await supabase
          .from('cache_proposicoes_recentes')
          .upsert(proposicaoProcessada, { onConflict: 'id_proposicao' });

        if (upsertError) {
          console.error('Erro ao salvar proposição:', upsertError);
        } else {
          proposicoesProcessadas.push(proposicaoProcessada);
        }

      } catch (error) {
        console.error(`Erro ao processar proposição ${pl.id}:`, error);
      }
    }

    console.log('Proposições processadas:', proposicoesProcessadas.length);

    return new Response(JSON.stringify({ proposicoes: proposicoesProcessadas }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
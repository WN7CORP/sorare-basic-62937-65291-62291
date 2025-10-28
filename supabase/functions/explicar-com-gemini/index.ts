import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { contexto, dados } = await req.json();
    
    console.log('Gerando explicação com Gemini:', { contexto, dados });

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    // Criar prompt especializado baseado no contexto
    let systemPrompt = '';
    let userPrompt = '';

    switch (contexto) {
      case 'cargo_eleitoral':
        systemPrompt = 'Você é um professor de Direito Eleitoral que explica de forma clara e educativa sobre cargos políticos no Brasil.';
        userPrompt = `Explique de forma didática e objetiva (máximo 200 palavras) o cargo de ${dados.cargo}. Inclua: função principal, responsabilidades, mandato, como é eleito e importância para a democracia brasileira.`;
        break;

      case 'estatisticas_eleicao':
        systemPrompt = 'Você é um analista político que explica estatísticas eleitorais de forma acessível.';
        userPrompt = `Explique o significado e importância destas estatísticas eleitorais (máximo 150 palavras): ${JSON.stringify(dados.estatisticas)}. Use linguagem simples e dê contexto sobre o que esses números representam para a democracia.`;
        break;

      case 'candidato':
        systemPrompt = 'Você é um educador cívico que ajuda eleitores a entenderem melhor o processo eleitoral.';
        userPrompt = `Explique (máximo 100 palavras) os principais dados que um eleitor deve observar ao pesquisar um candidato: número, partido, situação eleitoral, bens declarados. Contextualize porque essas informações são importantes.`;
        break;

      case 'resultados_eleicao':
        systemPrompt = 'Você é um especialista em processo democrático que explica resultados eleitorais de forma imparcial.';
        userPrompt = `Explique (máximo 150 palavras) como interpretar os resultados de uma eleição no Brasil. Aborde: o que significam os percentuais, turno único vs segundo turno, votos válidos vs brancos/nulos, e importância do comparecimento eleitoral.`;
        break;

      case 'historico_eleicoes':
        systemPrompt = 'Você é um historiador político que contextualiza a evolução do sistema eleitoral brasileiro.';
        userPrompt = `Explique (máximo 200 palavras) a importância do histórico eleitoral no Brasil. Aborde: marcos importantes desde 1945, a evolução da democracia brasileira, urna eletrônica e o fortalecimento das instituições democráticas.`;
        break;

      case 'eleitorado':
        systemPrompt = 'Você é um cientista político que explica o perfil do eleitorado brasileiro.';
        userPrompt = `Explique (máximo 150 palavras) a importância de conhecer os dados do eleitorado brasileiro. Aborde: distribuição regional, perfil demográfico, biometria e como essas informações contribuem para a segurança e transparência do processo eleitoral.`;
        break;

      case 'legislacao_eleitoral':
        systemPrompt = 'Você é um advogado especialista em Direito Eleitoral que explica legislação de forma didática.';
        userPrompt = `Explique (máximo 150 palavras) a importância da legislação eleitoral no Brasil. Aborde: o que é o Código Eleitoral, seu papel na democracia, principais garantias aos eleitores e candidatos.`;
        break;

      default:
        systemPrompt = 'Você é um educador cívico que explica conceitos eleitorais de forma clara e objetiva.';
        userPrompt = `Explique de forma educativa (máximo 150 palavras): ${dados.pergunta || 'processo eleitoral brasileiro'}`;
    }

    // Chamar API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Gemini:', errorText);
      throw new Error(`Erro ao chamar Gemini API: ${response.status}`);
    }

    const data = await response.json();
    const explicacao = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar explicação.';

    console.log('Explicação gerada com sucesso');

    return new Response(
      JSON.stringify({ explicacao }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro em explicar-com-gemini:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar explicação',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

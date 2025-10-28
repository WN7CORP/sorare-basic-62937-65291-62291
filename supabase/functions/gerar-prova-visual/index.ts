import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo_prova, descricao, contexto_caso } = await req.json();
    
    console.log('🖼️ Gerando imagem de prova:', { tipo_prova, descricao });

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Credenciais do Supabase não configuradas');
    }

    // Criar prompt específico baseado no tipo de prova
    let promptBase = '';
    switch (tipo_prova) {
      case 'documental':
        promptBase = `Crie uma imagem realista de um documento oficial brasileiro: ${descricao}. 
        Estilo: documento formal com carimbo, assinatura, papel timbrado, aparência profissional e legível.
        Layout: formato A4, margens corretas, cabeçalho formal.
        Qualidade: alta resolução, sem erros visuais, aparência de documento real.`;
        break;
      case 'pericial':
        promptBase = `Crie uma imagem de laudo pericial técnico: ${descricao}.
        Estilo: relatório técnico com gráficos, tabelas, dados científicos, logotipo de instituto pericial.
        Layout: profissional, com numeração de páginas, carimbos técnicos.
        Detalhes: incluir dados técnicos realistas, medições, análises.`;
        break;
      case 'fotografia':
        promptBase = `Crie uma fotografia realista que sirva como prova: ${descricao}.
        Estilo: foto jornalística, realista, boa iluminação.
        Contexto: ${contexto_caso}.
        Qualidade: fotografia nítida, profissional, que evidencie o que precisa ser provado.`;
        break;
      default:
        promptBase = `Crie uma imagem realista de prova judicial: ${descricao}.
        Contexto: ${contexto_caso}.
        Estilo: documento ou evidência formal, aparência profissional.`;
    }

    const prompt = `${promptBase}

IMPORTANTE: 
- A imagem deve ter aparência REALISTA e PROFISSIONAL
- Texto legível quando aplicável
- Sem marca d'água
- Alta qualidade
- Apropriada para uso em processo judicial`;

    console.log('📝 Prompt criado para geração');

    // Gerar imagem com Gemini Flash Image
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
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'rate_limit',
            message: 'Limite de requisições atingido. Tente novamente em alguns minutos.'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`Erro ao gerar imagem: ${response.status}`);
    }

    const data = await response.json();
    
    // Nota: Gemini 2.0 pode não suportar geração de imagens diretamente
    // Esta é uma implementação de fallback que retorna uma mensagem
    console.log('⚠️ Aviso: Geração de imagem com Gemini pode não estar disponível');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'image_generation_unavailable',
        message: 'Geração de imagens não disponível com Gemini Premium. Use descrição textual da prova.'
      }),
      {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro ao gerar prova visual:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

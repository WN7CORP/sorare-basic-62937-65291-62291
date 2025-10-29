import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
  contexto: {
    tipo: string;
    nome: string;
    resumo?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contexto }: RequestBody = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log('📚 Chat Professora Jurista - Contexto:', contexto.nome);

    // System prompt contextual específico para juristas
    const systemPrompt = `Você é uma professora de Direito especializada em história jurídica brasileira.

Contexto atual:
- Você está ajudando o aluno a entender sobre: **${contexto.nome}**
- Tipo: ${contexto.tipo}
${contexto.resumo ? `- Resumo: ${contexto.resumo}` : ''}

Suas características:
- Didática e paciente
- Usa linguagem clara e acessível
- Relaciona conceitos históricos com a prática jurídica atual
- Fornece exemplos concretos quando relevante
- Incentiva o aprendizado crítico

Como responder:
1. Mantenha o foco no jurista em questão (${contexto.nome})
2. Seja concisa, mas completa (máximo 200 palavras por resposta)
3. Use emojis ocasionalmente para tornar a explicação mais amigável
4. Quando apropriado, mencione como o trabalho deste jurista influencia o direito atual
5. Se o aluno perguntar sobre algo não relacionado ao jurista, redirecione gentilmente
6. Forneça respostas em formato markdown para melhor legibilidade

Exemplo de resposta:
"📚 Rui Barbosa foi fundamental para... [explicação]

⚖️ **Impacto atual:** Suas ideias sobre... influenciam até hoje...

💡 **Curiosidade:** Você sabia que..."`;

    // Preparar mensagens para a API Gemini
    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Adicionar system prompt como primeira mensagem do modelo
    contents.unshift({
      role: 'model',
      parts: [{ text: systemPrompt }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Gemini:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!resposta) {
      throw new Error('Resposta vazia da API');
    }

    console.log('✅ Resposta gerada com sucesso');

    return new Response(
      JSON.stringify({ resposta }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro no chat professora jurista:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar chat';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        resposta: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

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
    const { messages, files } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const systemPrompt = `Você é o Assistente de Refutação K, um especialista em argumentação lógica e jurídica. Sua função é refutar textos, comentários, opiniões ou argumentos apresentados pelo usuário, mostrando falhas de lógica, inconsistências, contradições ou ausência de base jurídica.

Funções principais:
- Analisar um texto, print ou comentário e refutar com base em lógica, fatos, leis ou doutrina.
- Apresentar contra-argumentos claros, firmes e fundamentados.
- Mostrar como o usuário pode responder de forma elegante, inteligente e convincente.
- Quando solicitado, oferecer versões curtas (para redes sociais) e versões formais (para parecer jurídico ou texto acadêmico) da refutação.

Instruções de comportamento:
- Seja direto, racional e respeitoso.
- Baseie-se sempre em coerência argumentativa e princípios jurídicos.
- Explique, quando possível, a falácia ou erro retórico cometido pelo autor original.
- Nunca ofenda o autor do texto — ataque apenas a ideia, nunca a pessoa.

Tom: firme, lógico e elegante — como um debatedor jurídico com domínio técnico e retórico.

**CRÍTICO - Sugestões de Perguntas:**
Ao final de CADA resposta, você DEVE incluir 2-3 sugestões de perguntas/tópicos que a pessoa pode explorar, no formato:

[SUGESTÕES]
Pergunta relevante 1 baseada no contexto?
Pergunta relevante 2 que aprofunda o assunto?
Pergunta relevante 3 relacionada ao tema?
[/SUGESTÕES]`;

    // Preparar conteúdo para API do Gemini
    const parts: any[] = [];
    
    let conversationText = systemPrompt + '\n\n';
    
    if (files && files.length > 0) {
      conversationText += '\n**INSTRUÇÃO CRÍTICA**: Arquivos foram anexados. Você DEVE analisar o conteúdo REAL destes arquivos. NÃO invente ou suponha nada. Leia e descreva exatamente o que está nos documentos/imagens.\n\n';
    }
    
    for (const msg of messages) {
      conversationText += `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}\n\n`;
    }
    
    parts.push({ text: conversationText });

    const lastUserMessage = messages[messages.length - 1];
    const isFileOnly = files && files.length > 0 && (!lastUserMessage?.content || lastUserMessage.content === 'Por favor, analise o arquivo anexado.');
    
    // Adicionar imagens/PDFs se houver
    if (files && files.length > 0) {
      for (const file of files) {
        const base64Data = file.data.includes('base64,') 
          ? file.data.split('base64,')[1] 
          : file.data;
        
        if (file.type.startsWith('image/')) {
          let mimeType = 'image/jpeg';
          if (file.data.includes('image/png')) mimeType = 'image/png';
          else if (file.data.includes('image/webp')) mimeType = 'image/webp';
          else if (file.data.includes('image/gif')) mimeType = 'image/gif';
          
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        } else if (file.type === 'application/pdf' || file.name?.endsWith('.pdf')) {
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          });
        }
      }
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + DIREITO_PREMIUM_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'quota_exceeded',
            message: '⏱️ Limite de perguntas atingido. Por favor, aguarde alguns minutos e tente novamente.'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`Erro da API Gemini: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!assistantMessage) {
      throw new Error('Resposta inválida da API Gemini');
    }

    // Extrair sugestões de perguntas
    const suggestionsMatch = assistantMessage.match(/\[SUGESTÕES\]([\s\S]*?)\[\/SUGESTÕES\]/);
    let suggestions = null;
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1].trim();
      suggestions = suggestionsText.split('\n').filter((s: string) => s.trim().length > 0);
      assistantMessage = assistantMessage.replace(/\[SUGESTÕES\][\s\S]*?\[\/SUGESTÕES\]/g, '').trim();
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        showActions: isFileOnly || assistantMessage.length > 200,
        suggestions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro no chat-refutacao:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

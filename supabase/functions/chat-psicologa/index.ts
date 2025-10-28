import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    // System prompt para a assistente psicóloga
    const systemPrompt = `Você é uma psicóloga especializada em saúde mental de estudantes de direito. Seu nome é Dra. Sofia 💜

**Sua missão:**
- Oferecer suporte emocional e psicológico extremamente caloroso e acolhedor para estudantes de direito
- Ajudar a gerenciar estresse, ansiedade e sobrecarga mental com muito carinho
- Ensinar técnicas de bem-estar e autocuidado de forma gentil
- Identificar sinais de burnout e sugerir intervenções com empatia
- Criar conexão emocional genuína, profunda e verdadeira

${files && files.length > 0 ? '\n**IMPORTANTE**: Arquivos/imagens foram anexados. Analise o conteúdo REAL destes arquivos. NÃO invente ou suponha nada. Descreva exatamente o que vê.\n' : ''}

**Tom de comunicação (CRÍTICO - FUNDAMENTAL):**
- EXTREMAMENTE meigo, acolhedor, empático e compreensivo 💙💜
- MUITO caloroso e próximo (como uma melhor amiga querida que também é profissional de saúde mental)
- Completamente não julgamental e profundamente validador
- Encorajador, esperançoso e inspirador ✨🌟
- Use MÍNIMO 6-8 emojis POR RESPOSTA distribuídos estrategicamente para transmitir calor e emoção profunda
- Fale de forma gentil, meiga e afetuosa (use expressões como "querido/querida", "meu bem", "amor", "minha querida pessoa")
- Seja EXTREMAMENTE sentimental e emotiva nas respostas - mostre que você SE IMPORTA MUITO e SENTE junto
- Use exclamações suaves e reticências emotivas para criar intimidade e empatia

**Emojis OBRIGATÓRIOS a usar (MÍNIMO 6-8 por resposta):**
- 💙 💜 🤗 💕 para acolhimento e empatia profunda
- 🌱 ✨ 🌟 💫 para crescimento e esperança
- 💭 🧘‍♀️ 🕊️ para reflexão e paz interior
- 😊 😌 🥰 para tranquilidade e carinho
- 🫂 💗 para apoio emocional intenso
- 🌈 🌸 para superação e renovação
- 💪 ❤️‍🩹 para força e cura emocional

**Estrutura de atendimento:**
1. **Acolhimento inicial MUITO caloroso com EMOJIS**: Use expressões como "Que bom que você está aqui comigo, meu bem 💜🤗", "Estou aqui para te ouvir e acolher com todo carinho 💕✨", "Sei que não é fácil, mas você é tão corajoso/a por compartilhar isso comigo... 💙🫂"
2. **Escuta ativa profundamente empática COM EMOÇÃO**: Demonstre que REALMENTE entende e SE IMPORTA ("Imagino como isso deve ser tão difícil para você, querida... 💕😔", "É completamente compreensível que você se sinta assim, meu amor 🫂💜", "Meu coração aperta ao ouvir o que você está passando... 💙")
3. **Validação emocional intensa E SENTIMENTAL**: SEMPRE valide os sentimentos de forma muito carinhosa e emotiva antes de sugerir qualquer coisa
4. **Intervenção gentil e meiga COM MUITO CARINHO**: Ofereça técnicas práticas de forma acessível e extremamente amorosa:
   - Exercícios de respiração (técnica 4-7-8) 🌬️
   - Técnicas de grounding (5-4-3-2-1) 🌱
   - Organização de rotina equilibrada ✨
   - Estabelecimento de limites saudáveis 💪
   - Mindfulness e meditação guiada 🧘‍♀️
5. **Sugestões de continuidade**: SEMPRE termine sugerindo 2-3 perguntas carinhosas que a pessoa pode fazer

**CRÍTICO - Sugestões de Perguntas:**
Ao final de CADA resposta, você DEVE incluir 2-3 sugestões de perguntas/tópicos que a pessoa pode explorar, no formato:

[SUGESTÕES]
Como posso criar uma rotina de autocuidado realista?
Quais técnicas funcionam melhor para ansiedade pré-prova?
Como lidar com a comparação com outros colegas?
[/SUGESTÕES]

As sugestões devem:
- Ser relevantes ao que a pessoa compartilhou
- Aprofundar a conversa de forma gentil
- Oferecer novas perspectivas acolhedoras
- Ser escritas de forma convidativa e carinhosa

**Quando recomendar livros:**
- Se identificar necessidade de desenvolvimento pessoal
- Para complementar técnicas ensinadas
- Quando a pessoa mencionar interesse em aprofundar-se

**Como recomendar:**
Ao recomendar um livro, você deve incluir no final da sua resposta (antes das sugestões):

[LIVRO: {id}]

Onde {id} é o ID do livro da tabela BIBLIOTECA-FORA-DA-TOGA.

**IMPORTANTE:**
- SEMPRE valide os sentimentos da pessoa PRIMEIRO de forma muito meiga
- Não minimize NUNCA a dor ou dificuldade
- Ofereça esperança mas seja realista e gentil
- Sugira ajuda profissional presencial se identificar casos graves (depressão severa, ideação suicida)
- Use exemplos práticos e aplicáveis de forma afetuosa
- Seja EXTREMAMENTE empática, meiga e próxima
- Crie uma atmosfera de SEGURANÇA EMOCIONAL total
- Mostre que você SE IMPORTA PROFUNDAMENTE e genuinamente
- Use muito carinho e afeto nas palavras

**Exemplo de resposta ideal:**
"Meu bem, meu coração aperta ao ler isso... 💙😔 Entendo completamente como você se sente 💜🫂 A pressão dos estudos pode ser realmente avassaladora, querido/a, e é super normal se sentir sobrecarregado às vezes. Você não está sozinho nisso, viu? Estou aqui com você, sentindo junto... 🤗💕✨

[... resto da resposta com técnicas e orientações de forma muito meiga e acolhedora ...]

Lembre-se, minha querida pessoa: cuidar de você não é luxo, é uma necessidade vital! 💪 E você merece TODO esse cuidado e carinho 💜✨ Estou muito, muito orgulhosa de você estar buscando ajuda... isso mostra tanta coragem! 🌟💕🌈

[SUGESTÕES]
💭 Como posso identificar quando estou no meu limite emocional?
🫂 Que técnicas rápidas posso usar em momentos de crise de ansiedade?
💜 Como conversar com minha família sobre minha saúde mental?
[/SUGESTÕES]"

Responda SEMPRE de forma EXTREMAMENTE empática, meiga, sentimental, carinhosa e acolhedora. Use MUITOS emojis (mínimo 6-8 por resposta) e expressões de afeto genuíno. Seja MUITO emotiva e demonstre que você SE IMPORTA profundamente.`;

    console.log("Iniciando chat com assistente psicóloga");

    // Preparar mensagens incluindo arquivos se houver
    const apiMessages = [...messages];
    
    // Se houver arquivos, adicionar à última mensagem do usuário
    if (files && files.length > 0) {
      const lastUserMsgIndex = apiMessages.length - 1;
      const lastMsg = apiMessages[lastUserMsgIndex];
      
      // Criar conteúdo multimodal
      const multimodalContent: any[] = [
        { type: "text", text: lastMsg.content || "Por favor, analise o arquivo anexado." }
      ];
      
      // Adicionar cada arquivo
      for (const file of files) {
        const base64Data = file.data.includes('base64,') 
          ? file.data.split('base64,')[1] 
          : file.data;
        
        if (file.type.startsWith('image/')) {
          multimodalContent.push({
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${base64Data}`
            }
          });
        }
        // Nota: Lovable AI Gateway não suporta PDFs diretamente ainda
        // PDFs precisariam ser convertidos para imagens ou texto primeiro
      }
      
      apiMessages[lastUserMsgIndex] = {
        ...lastMsg,
        content: multimodalContent
      };
    }

    const geminiMessages = apiMessages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: Array.isArray(msg.content) ? msg.content : [{ text: msg.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...geminiMessages
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Garantir presença de emojis: se não houver, adicionar acolhimento com emojis
    const hasEmoji = /[\p{Emoji_Presentation}\u{1F300}-\u{1FAFF}]/u.test(assistantMessage);
    if (!hasEmoji) {
      assistantMessage = `💙🤗 ${assistantMessage}\n\nCom carinho, estou com você 💜✨`;
    }

    // Extrair sugestões de perguntas
    const suggestionsMatch = assistantMessage.match(/\[SUGESTÕES\]([\s\S]*?)\[\/SUGESTÕES\]/);
    let suggestions: string[] | null = null;
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1].trim();
      suggestions = suggestionsText.split('\n').filter((s: string) => s.trim().length > 0);
      // Remover as tags de sugestões da mensagem
      assistantMessage = assistantMessage.replace(/\[SUGESTÕES\][\s\S]*?\[\/SUGESTÕES\]/g, '').trim();
    }

    // Fallback de sugestões se o modelo não enviar
    if (!suggestions) {
      const lastUser = messages?.[messages.length - 1]?.content || '';
      suggestions = [
        'Você quer me contar como isso tem afetado seu dia a dia? 💜',
        'Quais momentos você sente que a ansiedade aparece com mais força? 🤗',
        'Topa tentarmos uma técnica de respiração agora, juntinhos? ✨'
      ];
      if (lastUser.length > 0 && lastUser.length < 120) {
        suggestions.unshift(`Quer falar um pouco mais sobre: "${lastUser}"? 💙`);
        suggestions = suggestions.slice(0, 3);
      }
    }

    // Verificar se há recomendação de livro no formato [LIVRO: id]
    const bookMatch = assistantMessage.match(/\[LIVRO:\s*(\d+)\]/);
    let bookRecommendation = null;

    if (bookMatch) {
      const bookId = bookMatch[1];
      // Remover a tag [LIVRO: id] da mensagem
      assistantMessage = assistantMessage.replace(/\[LIVRO:\s*\d+\]/g, '').trim();

      // Buscar o livro na tabela
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log("Buscando livro ID:", bookId);

      const { data: book, error } = await supabase
        .from('BIBLIOTECA-FORA-DA-TOGA')
        .select('*')
        .eq('id', parseInt(bookId))
        .single();

      if (!error && book) {
        bookRecommendation = {
          id: book.id,
          title: book.livro,
          author: book.autor,
          cover: book['capa-livro'],
          about: book.sobre,
        };
        console.log("Livro encontrado:", book.livro);
      } else {
        console.error("Erro ao buscar livro:", error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        bookRecommendation,
        suggestions
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no chat-psicologa:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
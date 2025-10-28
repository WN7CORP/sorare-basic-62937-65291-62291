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
    const { messages, files } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    // System prompt para a assistente de TCC
    const systemPrompt = `Você é uma professora orientadora especializada em auxiliar estudantes de direito com seus TCCs (Trabalhos de Conclusão de Curso). Seu nome é Profa. Dra. Helena.

${files && files.length > 0 ? '\n**IMPORTANTE**: Arquivos/imagens foram anexados. Analise o conteúdo REAL destes arquivos. NÃO invente ou suponha nada. Leia e descreva exatamente o que está nos documentos/imagens.\n' : ''}

**Sua missão:**
- Guiar estudantes na elaboração de TCCs jurídicos de excelência
- Auxiliar em todas as etapas: tema, problema, metodologia, desenvolvimento e finalização
- Ensinar técnicas de pesquisa científica jurídica
- Orientar sobre normas ABNT e formatação acadêmica

**Tom de comunicação:**
- Profissional e acadêmico, mas acessível
- Encorajador e construtivo
- Paciente e didático
- Exigente mas compreensivo

**Estrutura de orientação:**

1. **Diagnóstico inicial**: Sempre pergunte primeiro em qual fase está:
   - "Qual é o tema do seu TCC?"
   - "Qual área do direito você está trabalhando?"
   - "Já tem o problema de pesquisa definido?"
   - "Qual metodologia você pretende usar?"
   - "Em que fase está? (projeto, desenvolvimento, finalização)"

2. **Delimitação de tema:**
   - Ajude a especificar temas amplos demais
   - Sugira recortes temporais, espaciais ou temáticos
   - Verifique viabilidade e relevância acadêmica
   - Exemplo: "Direito Penal" → "A aplicação do princípio da insignificância nos crimes contra o patrimônio: análise da jurisprudência do STJ (2018-2023)"

3. **Formulação do problema:**
   - Ensine a formular perguntas de pesquisa claras
   - Problema deve ser específico, relevante e respondível
   - Exemplo: "Como o STJ tem aplicado o princípio da insignificância em casos de furto?"

4. **Metodologia:**
   - Pesquisa bibliográfica (obrigatória)
   - Análise documental (leis, jurisprudência)
   - Pesquisa de campo (questionários, entrevistas)
   - Estudo de caso
   - Método dedutivo/indutivo/dialético

5. **Estrutura sugerida:**
   - Introdução (problema, justificativa, objetivos, metodologia)
   - Capítulo 1: Fundamentação teórica
   - Capítulo 2: Desenvolvimento (análise)
   - Capítulo 3: Jurisprudência/casos práticos (se aplicável)
   - Conclusão
   - Referências (ABNT)

6. **Revisão bibliográfica:**
   - Como buscar: Google Scholar, revistas jurídicas, bibliotecas digitais
   - Fontes confiáveis: doutrinas clássicas, artigos científicos, jurisprudência
   - Organização: fichamentos, resumos, citações
   - Gestores de referência: Mendeley, Zotero

7. **Análise jurisprudencial:**
   - Onde buscar: STF, STJ, tribunais regionais
   - Como analisar: identificar padrões, teses prevalentes
   - Como citar decisões judiciais

8. **Escrita acadêmica:**
   - Linguagem formal e técnica
   - Argumentação clara e fundamentada
   - Citações diretas e indiretas (ABNT NBR 10520)
   - Impessoalidade (evitar primeira pessoa)
   - Coesão e coerência

9. **Formatação ABNT:**
   - Margens, fonte, espaçamento (NBR 14724)
   - Sumário, listas, ilustrações
   - Referências (NBR 6023)
   - Citações (NBR 10520)

10. **Cronograma:**
    - Ajude a criar timeline realista
    - Divida em etapas mensuráveis
    - Estabeleça metas semanais/mensais

**Dicas importantes:**
- "Comece escrevendo, não espere perfeição"
- "Revise várias vezes, TCC se constrói em camadas"
- "Mantenha diálogo constante com seu orientador oficial"
- "Organize suas referências desde o início"
- "Leia TCCs aprovados da sua instituição como modelo"

**Exemplos práticos:**
- Sempre que possível, forneça exemplos concretos
- Mostre diferenças entre bom e mau problema de pesquisa
- Demonstre como fazer citações corretamente
- Forneça templates de estrutura

**IMPORTANTE:**
- Seja específica nas orientações
- Adapte-se ao nível do aluno
- Reconheça progressos, mesmo pequenos
- Aponte problemas mas sempre sugira soluções
- Lembre que é um processo, não produto final imediato

**CRÍTICO - Sugestões de Perguntas:**
Ao final de CADA resposta, você DEVE incluir 2-3 sugestões de perguntas/tópicos que a pessoa pode explorar, no formato:

[SUGESTÕES]
Pergunta relevante 1 sobre o TCC?
Pergunta relevante 2 que aprofunda o tema?
Pergunta relevante 3 relacionada à metodologia?
[/SUGESTÕES]

As sugestões devem:
- Ser relevantes ao estágio do TCC do estudante
- Aprofundar a orientação
- Oferecer novas perspectivas acadêmicas
- Ser escritas de forma clara e profissional

Responda de forma estruturada, didática e com exemplos práticos sempre que possível.`;

    console.log("Iniciando chat com assistente de TCC");

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
            maxOutputTokens: 2500,
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

    // Extrair sugestões de perguntas
    const suggestionsMatch = assistantMessage.match(/\[SUGESTÕES\]([\s\S]*?)\[\/SUGESTÕES\]/);
    let suggestions = null;
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1].trim();
      suggestions = suggestionsText.split('\n').filter((s: string) => s.trim().length > 0);
      // Remover as tags de sugestões da mensagem
      assistantMessage = assistantMessage.replace(/\[SUGESTÕES\][\s\S]*?\[\/SUGESTÕES\]/g, '').trim();
    }

    console.log("Resposta gerada com sucesso");

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        suggestions
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no chat-tcc:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, conteudo, arquivo, nomeArquivo, acao, nivel } = await req.json();
    
    console.log("📝 [GERAR-RESUMO] Iniciando - Tipo:", tipo, "Nome arquivo:", nomeArquivo, "Ação:", acao, "Nível:", nivel);

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    let textoParaResumir = "";
    let base64Data: string | undefined;
    let mimeType: string | undefined;

    // Processar conforme o tipo de input
    if (tipo === "texto") {
      textoParaResumir = conteudo;
    } else if (tipo === "pdf" || tipo === "imagem") {
      if (!arquivo) {
        throw new Error("Arquivo não fornecido");
      }

      // Extrair base64 do data URL
      base64Data = arquivo.split(",")[1];
      mimeType = arquivo.split(";")[0].split(":")[1];

      console.log("📄 [ARQUIVO] Processando arquivo. Tipo:", tipo, "MimeType:", mimeType, "Tamanho base64:", base64Data?.length || 0);

      // Para PDFs, usar abordagem de documento completo
      // Para imagens, usar visão direta
      const extractionMessages = tipo === "pdf" 
        ? [{
            role: "user" as const,
            content: `Por favor, extraia TODO o texto do seguinte documento PDF em formato base64. 
            Mantenha a estrutura e formatação. Retorne apenas o texto extraído.
            
            Base64: ${base64Data}`
          }]
        : [{
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text: "Extraia TODO o texto visível nesta imagem. Seja preciso e detalhado. Retorne apenas o texto extraído.",
              },
              {
                type: "image_url" as const,
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          }];

      let extractionAttempts = 0;
      const maxAttempts = 3;
      
      while (extractionAttempts < maxAttempts) {
        try {
          extractionAttempts++;
          console.log(`🔄 [EXTRAÇÃO] Tentativa ${extractionAttempts}/${maxAttempts} de extração de texto`);
          
          const geminiMessages = extractionMessages.map((msg: any) => ({
            role: 'user',
            parts: Array.isArray(msg.content) ? msg.content.map((c: any) => {
              if (c.type === 'text') return { text: c.text };
              if (c.type === 'image_url') return { inlineData: { mimeType: 'image/jpeg', data: c.image_url.url.split('base64,')[1] } };
              return c;
            }) : [{ text: msg.content }]
          }));

          const visionResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: geminiMessages,
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 3000,
                }
              }),
            }
          );

          if (!visionResponse.ok) {
            const errorText = await visionResponse.text();
            console.error(`Tentativa ${extractionAttempts} - Erro HTTP ${visionResponse.status}:`, errorText);
            
            if (extractionAttempts >= maxAttempts) {
              throw new Error(`Erro ao processar ${tipo}. Status: ${visionResponse.status}. Tente: 1) Arquivo menor 2) Converter PDF para imagem 3) Usar JPG/PNG ao invés de PDF`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }

          const visionData = await visionResponse.json();
          textoParaResumir = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (!textoParaResumir) {
            console.error("Resposta da API sem conteúdo:", JSON.stringify(visionData));
            throw new Error("A API não retornou conteúdo extraído");
          }
          
          console.log(`✅ [SUCESSO] Texto extraído (tentativa ${extractionAttempts}) - ${textoParaResumir.length} caracteres`);
          break;
          
        } catch (error) {
          console.error(`Tentativa ${extractionAttempts} falhou:`, error);
          if (extractionAttempts >= maxAttempts) {
            throw new Error(`Falha na extração após ${maxAttempts} tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (acao === "extrair") {
      return new Response(
        JSON.stringify({
          extraido: textoParaResumir,
          chars: textoParaResumir?.length || 0,
          tipo,
          nomeArquivo,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((!textoParaResumir || textoParaResumir.trim().length === 0) && !(tipo === "imagem" && arquivo)) {
      throw new Error("Não foi possível extrair conteúdo suficiente do arquivo");
    }

    // Preparar prompt e mensagens para o resumo (com níveis)
    const nivelEscolhido = (nivel === "resumido" || nivel === "super_resumido") ? nivel : "detalhado";

    const promptTexto = `Você é um especialista em criar resumos jurídicos estruturados.

NÍVEL DE DETALHE: ${nivelEscolhido.toUpperCase()}

CONTEÚDO A RESUMIR:
${textoParaResumir}

INSTRUÇÕES DE FORMATAÇÃO (Markdown):
- Use cabeçalhos (# ## ###), negrito (**texto**), listas e emojis profissionais
- Se "detalhado": 2-3 parágrafos por tópico, textos de 3-5 linhas
- Se "resumido": 1 parágrafo por tópico, textos de 2-3 linhas
- Se "super_resumido": 4-6 bullets diretos com 10-15 palavras cada
- Cite artigos/leis quando aplicável

ESTRUTURA SUGERIDA:
# 📄 Resumo Jurídico

## 🎯 Visão Geral

## 📋 Pontos Principais

## ⚖️ Fundamentos Legais

## 🔍 Conceitos-Chave

## 📌 Conclusão`;

    let messages: any[] = [];
    if (tipo === "imagem" && ((textoParaResumir?.trim().length || 0) < 50) && arquivo && base64Data && mimeType) {
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: `Analise a imagem a seguir e gere um resumo jurídico no nível: ${nivelEscolhido}. Quando houver texto, considere-o; caso contrário, descreva de forma objetiva o conteúdo visual e sua relevância jurídica quando aplicável.` },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]
        }
      ];
    } else {
      messages = [{ role: "user", content: promptTexto }];
    }

    console.log("🤖 [GEMINI] Gerando resumo estruturado com Gemini 2.0 Flash | Nível:", nivelEscolhido, "| Caracteres:", textoParaResumir.length);

    const geminiMessages = messages.map((msg: any) => ({
      role: 'user',
      parts: Array.isArray(msg.content) ? msg.content.map((c: any) => {
        if (c.type === 'text') return { text: c.text };
        if (c.type === 'image_url') return { inlineData: { mimeType: 'image/jpeg', data: c.image_url.url.split('base64,')[1] } };
        return c;
      }) : [{ text: msg.content }]
    }));

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2500,
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro ao gerar resumo:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados para Lovable AI. Adicione créditos para continuar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Falha ao gerar resumo com IA");
    }

    const aiData = await aiResponse.json();
    const resumo = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("✨ [SUCESSO] Resumo gerado! Tamanho:", resumo.length, "| Tokens usados:", aiData.usage?.total_tokens || 0);

    return new Response(
      JSON.stringify({
        resumo,
        tokens_usados: aiData.usage?.total_tokens || 0,
        tempo_processamento: Date.now(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função gerar-resumo:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar resumo",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

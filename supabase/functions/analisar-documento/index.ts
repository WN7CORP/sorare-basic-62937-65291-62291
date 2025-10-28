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
    const { tipo, fileBase64, fileName } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    // Definir o prompt baseado no tipo de análise
    let systemPrompt = '';
    
    switch (tipo) {
      case 'documento':
        systemPrompt = 'Você é um assistente jurídico especializado em análise de documentos. Analise o documento fornecido de forma SUPER DETALHADA e COMPLETA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📄 Análise do Documento\n\n## 🔍 Natureza do Documento\n[Identificar tipo e características]\n\n## 👥 Partes Envolvidas\n[Listar e detalhar cada parte]\n\n## 📋 Principais Cláusulas/Disposições\n[Analisar cada cláusula relevante com detalhes]\n\n## ⚠️ Pontos de Atenção\n[Destacar aspectos críticos]\n\n## 🚨 Riscos Identificados\n[Enumerar riscos com severidade]\n\n## 💡 Recomendações\n[Sugestões práticas e ações]\n\nUse negrito, listas, subtítulos e emojis para organização visual.';
        break;
      case 'peticao':
        systemPrompt = 'Você é um assistente jurídico especializado em análise de petições. Analise de forma SUPER DETALHADA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# ⚖️ Análise da Petição\n\n## 👥 Partes\n### Autor(es)\n[Detalhar]\n### Réu(s)\n[Detalhar]\n\n## 📝 Pedidos Principais\n[Listar e analisar cada pedido]\n\n## 📚 Fundamentos Jurídicos\n[Analisar base legal e jurisprudencial]\n\n## 📎 Provas Anexadas\n[Detalhar documentos]\n\n## ⏰ Prazos Relevantes\n[Identificar prazos críticos]\n\n## 🏗️ Estrutura e Qualidade\n[Avaliar organização e técnica]\n\n## 💡 Recomendações\n[Sugestões de melhoria]\n\nUse formatação rica com negrito, listas e emojis.';
        break;
      case 'prova':
        systemPrompt = 'Você é um corretor de provas jurídicas. Avalie de forma SUPER DETALHADA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📝 Correção da Prova\n\n## 📊 Análise Geral\n[Visão geral do desempenho]\n\n## ✅ Pontos Fortes\n[Destacar acertos e qualidades]\n\n## ❌ Pontos a Melhorar\n[Identificar erros e fragilidades]\n\n## ⚖️ Correção Técnica\n[Avaliar precisão jurídica]\n\n## 📚 Fundamentação Jurídica\n[Analisar base legal]\n\n## 💬 Clareza e Organização\n[Avaliar estrutura e comunicação]\n\n## 📈 Nota e Justificativa\n[Nota estimada com explicação]\n\n## 💡 Sugestões de Melhoria\n[Recomendações práticas]\n\nUse formatação rica e detalhada.';
        break;
      case 'resumo':
        systemPrompt = 'Você é um especialista em criar resumos estruturados de textos jurídicos. Crie um resumo SUPER DETALHADO e ORGANIZADO usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📚 Resumo do Documento\n\n## 🎯 Tema Principal\n[Identificar assunto central]\n\n## 📋 Tópicos Principais\n### 1️⃣ [Primeiro Tópico]\n- Subtópicos detalhados\n- Pontos-chave\n\n### 2️⃣ [Segundo Tópico]\n- Subtópicos detalhados\n- Pontos-chave\n\n[Continue numerando...]\n\n## 💡 Conceitos-Chave\n[Definir termos importantes]\n\n## 🔗 Conexões e Relações\n[Mostrar relações entre tópicos]\n\n## 📌 Conclusões\n[Síntese final]\n\nUse hierarquia clara e formatação visual.';
        break;
      case 'contrato':
        systemPrompt = 'Você é um especialista em análise de contratos. Analise de forma SUPER DETALHADA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📑 Análise Contratual\n\n## 📝 Tipo de Contrato\n[Identificar natureza]\n\n## 👥 Partes Contratantes\n[Detalhar qualificação]\n\n## 🎯 Objeto do Contrato\n[Descrever em detalhes]\n\n## ✅ Cláusulas Essenciais\n[Analisar cada cláusula importante]\n\n## ⚠️ Cláusulas Problemáticas\n[Identificar cláusulas abusivas ou arriscadas]\n\n## 🚨 Riscos Identificados\n[Enumerar riscos com níveis]\n\n## ⚖️ Aspectos Legais\n[Conformidade legal]\n\n## 💡 Recomendações\n[Sugestões práticas]\n\nUse negrito, tabelas e listas detalhadas.';
        break;
      case 'ocr':
        systemPrompt = 'Você é um especialista em OCR de documentos jurídicos. Extraia o texto de forma PRECISA mantendo a estrutura usando Markdown.\n\n# 📄 Texto Extraído\n\n[Extrair todo o texto preservando:\n- Parágrafos\n- Listas\n- Numeração\n- Estrutura hierárquica\n- Formatação visual]\n\nUse Markdown para organizar o texto extraído de forma clara e legível.';
        break;
      default:
        systemPrompt = 'Você é um assistente jurídico. Analise o documento fornecido de forma SUPER DETALHADA usando Markdown com estrutura clara, negrito, listas e emojis.';
    }

    console.log('Iniciando análise:', { tipo, fileName });

    // Extrair apenas os dados base64 da imagem
    const base64Data = fileBase64.includes('base64,') 
      ? fileBase64.split('base64,')[1] 
      : fileBase64;

    // Determinar o mime type
    let mimeType = 'image/jpeg';
    if (fileBase64.includes('image/png')) mimeType = 'image/png';
    else if (fileBase64.includes('image/webp')) mimeType = 'image/webp';
    else if (fileBase64.includes('application/pdf')) mimeType = 'application/pdf';

    // Preparar o conteúdo para a API do Gemini
    const parts: any[] = [
      { text: systemPrompt + `\n\nAnalise este documento: ${fileName}` },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ];

    // Chamar a API do Gemini diretamente
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
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Gemini:', response.status, errorText);
      throw new Error(`Erro na API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const resultado = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar resposta';

    console.log('Análise concluída com sucesso');

    return new Response(
      JSON.stringify({ 
        resultado,
        tipo,
        fileName 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

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
    const { tema } = await req.json();
    
    if (!tema) {
      throw new Error('Tema é obrigatório');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('Gerando estrutura de aula para:', tema);

    const prompt = `Você é um professor jurídico expert. Crie uma estrutura de aula COMPLETA, INTERATIVA e DIDÁTICA sobre: ${tema}

A aula deve ter EXATAMENTE 3 módulos, cada um com conteúdo RICO e EDUCATIVO:

ESTRUTURA DE CADA MÓDULO:
1. Nome do módulo (título curto e descritivo)
2. Ícone do módulo (escolha entre: BookOpen, Scale, Gavel, FileText, Users, Building)

3. CONTEÚDO TEÓRICO RICO EM MARKDOWN (600-800 palavras):
   - Use ## para títulos de seções
   - Use ### para subtítulos
   - Use **negrito** e *itálico* para ênfase
   - Use listas ordenadas (1., 2.) e não ordenadas (-)
   - OBRIGATORIAMENTE inclua 3-4 CARDS ESPECIAIS no formato:
     > ⚠️ **ATENÇÃO**: Ponto crítico importante
     > 💡 **IMPORTANTE**: Conceito-chave fundamental
     > 📌 **DICA PRÁTICA**: Aplicação no mundo real
     > ⚖️ **JURISPRUDÊNCIA**: Caso relevante
   - Organize em seções claras com títulos

4. EXEMPLO PRÁTICO DETALHADO:
   - Cenário realista (100-150 palavras)
   - Análise jurídica (150-200 palavras)
   - Solução fundamentada (100-150 palavras)
   
5. QUIZ RÁPIDO DE FIXAÇÃO:
   - 3 questões simples (V/F ou múltipla escolha)
   - Para reforço imediato do aprendizado
   
6. RESUMO EM TÓPICOS:
   - 5-7 pontos-chave do módulo

7. 6 termos-chave para matching (definições máx 80 chars)
8. 7 flashcards completos
9. 7 questões de múltipla escolha com explicações

Ao final dos 3 módulos, crie uma PROVA FINAL com 12 questões desafiadoras.

IMPORTANTE: 
- Retorne APENAS JSON puro, sem markdown, sem \`\`\`json
- O campo "teoria" deve conter markdown rico e formatado
- Os cards especiais (>, ⚠️, 💡, 📌, ⚖️) são OBRIGATÓRIOS
- Exemplo prático deve ser realista e aplicável

Formato JSON esperado:
{
  "titulo": "Título da Aula",
  "descricao": "Breve descrição do que será aprendido",
  "area": "${tema.includes('Penal') ? 'Direito Penal' : tema.includes('Civil') ? 'Direito Civil' : tema.includes('Constitucional') ? 'Direito Constitucional' : 'Direito'}",
  "modulos": [
    {
      "id": 1,
      "nome": "Nome do Módulo",
      "icone": "BookOpen",
      "teoria": "## Conceitos Fundamentais\n\nTexto rico em markdown...\n\n> ⚠️ **ATENÇÃO**: Ponto crítico...\n\n### Aplicação Prática\n\nMais conteúdo...",
      "exemploPratico": {
        "cenario": "Descrição do caso real...",
        "analise": "Análise jurídica detalhada...",
        "solucao": "Solução fundamentada..."
      },
      "quizRapido": [
        {
          "question": "Questão simples?",
          "options": ["Verdadeiro", "Falso"],
          "correctAnswer": 0,
          "explicacao": "Breve explicação"
        }
      ],
      "resumo": ["Ponto 1", "Ponto 2", "Ponto 3", "Ponto 4", "Ponto 5"],
      "matching": [
        {"termo": "Termo", "definicao": "Definição curta (máx 80 chars)"}
      ],
      "flashcards": [
        {"frente": "Pergunta", "verso": "Resposta completa", "exemplo": "Exemplo"}
      ],
      "questoes": [
        {
          "question": "Questão detalhada?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explicacao": "Explicação detalhada"
        }
      ]
    }
  ],
  "provaFinal": [
    {
      "question": "Questão desafiadora?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explicacao": "Explicação detalhada",
      "tempoLimite": 45
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um professor jurídico expert que cria aulas estruturadas e didáticas. Sempre retorne JSON puro válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Gemini:', response.status, errorText);
      throw new Error('Erro ao gerar estrutura da aula');
    }

    const data = await response.json();
    let estruturaText = data.choices[0].message.content;
    
    // Limpar markdown se presente
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const estrutura = JSON.parse(estruturaText);
    
    console.log('Estrutura gerada com sucesso:', estrutura.titulo);

    return new Response(JSON.stringify(estrutura), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro em gerar-estrutura-aula:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar estrutura da aula' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

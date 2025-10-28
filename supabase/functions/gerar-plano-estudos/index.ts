import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const diasSemanaMap: { [key: string]: string } = {
  seg: "Segunda-feira",
  ter: "Terça-feira",
  qua: "Quarta-feira",
  qui: "Quinta-feira",
  sex: "Sexta-feira",
  sab: "Sábado",
  dom: "Domingo",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materia, horasPorDia, diasSemana, duracaoSemanas, arquivo, tipoArquivo } = await req.json();
    
    console.log("Gerando plano - Matéria:", materia, "Horas:", horasPorDia, "Dias:", diasSemana.length, "Semanas:", duracaoSemanas);

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    const totalHoras = horasPorDia * diasSemana.length * duracaoSemanas;
    const diasFormatados = diasSemana.map((d: string) => diasSemanaMap[d]).join(", ");

    let conteudoArquivo = "";

    // Processar arquivo se houver
    if (arquivo && tipoArquivo) {
      const base64Data = arquivo.split(",")[1];
      const mimeType = arquivo.split(";")[0].split(":")[1];

      console.log("Processando arquivo:", tipoArquivo);

      const visionResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: tipoArquivo === "pdf"
                    ? "Extraia TODO o conteúdo deste documento (ementa, tópicos, cronograma). Mantenha a estrutura."
                    : "Extraia TODO o texto e informações desta imagem de ementa ou material de estudo."
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 3000,
            }
          }),
        }
      );

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        conteudoArquivo = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log("Conteúdo extraído do arquivo");
      }
    }

    // Gerar plano de estudos estruturado
    const prompt = `Você é um especialista em planejamento de estudos para Direito.

INFORMAÇÕES DO PLANO:
- Matéria: ${materia}
- Horas disponíveis por dia: ${horasPorDia}h
- Dias da semana: ${diasFormatados}
- Duração: ${duracaoSemanas} semanas
- Total de horas: ${totalHoras}h

${conteudoArquivo ? `CONTEÚDO DA EMENTA/MATERIAL:\n${conteudoArquivo}\n\n` : ""}

CRIE UM PLANO DE ESTUDOS ESTRUTURADO E COMPLETO:

# 📅 Plano de Estudos: ${materia}

---

## 🎯 Objetivo do Plano
[Descrição clara do que será aprendido e os objetivos de aprendizagem ao final do período]

---

## 📊 Visão Geral do Cronograma
- **Carga horária total**: ${totalHoras}h
- **Duração**: ${duracaoSemanas} semanas
- **Frequência**: ${diasSemana.length} dias por semana
- **Intensidade diária**: ${horasPorDia}h por dia

---

## 📚 Cronograma Semanal Detalhado

### Semana 1: [Tema/Módulo da Semana]

${diasSemana.map((dia: string) => `**${diasSemanaMap[dia]} (${horasPorDia}h)**
- 08:00-09:30: [Tópico específico com detalhes]
- 09:45-11:00: [Tópico específico com detalhes]
${horasPorDia >= 4 ? "- 14:00-16:00: [Exercícios práticos e revisão]\n" : ""}${horasPorDia >= 6 ? "- 16:15-18:00: [Leitura complementar e aprofundamento]\n" : ""}`).join("\n\n")}

[Continue este padrão para TODAS as ${duracaoSemanas} semanas, variando os temas e tópicos]

${duracaoSemanas >= 2 ? `\n### Semana 2: [Tema/Módulo da Semana]\n[Repita a estrutura com novos tópicos]\n` : ""}
${duracaoSemanas >= 3 ? `\n### Semana 3: [Tema/Módulo da Semana]\n[Repita a estrutura com novos tópicos]\n` : ""}
${duracaoSemanas >= 4 ? `\n### Semana 4: [Tema/Módulo da Semana]\n[Repita a estrutura com novos tópicos]\n` : ""}

---

## 📖 Materiais de Estudo Recomendados

### 📚 Bibliografia Principal
- [Livro 1]: [Autor] - Capítulos relevantes
- [Livro 2]: [Autor] - Seções recomendadas
- [Código/Lei]: Artigos específicos

### 🎥 Recursos Complementares
- [Vídeo-aulas, podcasts ou cursos online recomendados]
- [Plataformas de questões e simulados]

### 📝 Materiais de Apoio
- [Resumos, mapas mentais, flashcards]

---

## 💡 Estratégias e Dicas de Estudo

### 📋 Técnicas Recomendadas
1. **Revisão Espaçada**: [Explicação de como aplicar]
2. **Mapas Mentais**: [Como organizar o conteúdo visualmente]
3. **Resolução de Questões**: [Importância e frequência]
4. **Flashcards**: [Tópicos que se beneficiam desta técnica]

### ⏰ Gestão do Tempo
- Reserve os primeiros 15min para revisão do dia anterior
- Faça pausas de 10min a cada 50min de estudo
- Dedique a última sessão da semana para revisão geral

### 🎯 Metas Semanais
- Semana 1: [Meta específica]
- Semana 2: [Meta específica]
[Continue para todas as semanas]

---

## ✅ Checklist de Progresso

### Marcos de Aprendizagem
- [ ] Semana 1: [Competência ou tópico dominado]
- [ ] Semana 2: [Competência ou tópico dominado]
[Continue para todas as semanas]

### Avaliações Sugeridas
- Semana ${Math.ceil(duracaoSemanas / 2)}: Simulado parcial
- Semana ${duracaoSemanas}: Simulado completo

---

## 🔄 Revisão Final (Última Semana)

**Ciclo de Revisão**
${diasSemana.slice(0, 3).map((dia: string) => `- ${diasSemanaMap[dia]}: [Tópicos específicos para revisar]`).join("\n")}

**Simulado Final**
- Data sugerida: Último ${diasSemanaMap[diasSemana[diasSemana.length - 1]]}
- Tempo: ${horasPorDia}h
- Formato: [Questões dissertativas e objetivas]

---

## 📈 Acompanhamento e Ajustes

**Como avaliar seu progresso:**
- Revise semanalmente se está cumprindo as metas
- Ajuste o ritmo se necessário (sem comprometer a qualidade)
- Anote dúvidas para pesquisar ou tirar com professores

**Sinais de que está no caminho certo:**
✅ Consegue explicar os conceitos com suas próprias palavras
✅ Resolve questões com segurança crescente
✅ Identifica conexões entre diferentes tópicos

REGRAS IMPORTANTES:
- Seja EXTREMAMENTE específico nos tópicos de cada dia
- Distribua o conteúdo de forma equilibrada e progressiva
- Inclua tempo para revisão e prática
- Sugira materiais reais e acessíveis
- Use markdown profissional com emojis, listas e estrutura clara
- Adapte a profundidade conforme as horas disponíveis
- Crie um cronograma realista e executável`;

    console.log("Gerando plano estruturado com Gemini");

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 3500,
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro ao gerar plano:", errorText);
      throw new Error("Falha ao gerar plano de estudos com IA");
    }

    const aiData = await aiResponse.json();
    const plano = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("Plano gerado com sucesso, tamanho:", plano.length);

    return new Response(
      JSON.stringify({
        plano,
        totalHoras,
        topicos: [], // Poderia extrair do plano se necessário
        materiais: [], // Poderia extrair do plano se necessário
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função gerar-plano-estudos:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar plano",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

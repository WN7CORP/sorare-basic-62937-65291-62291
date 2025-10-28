import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResumoRecord {
  id: number;
  area: string;
  tema: string;
  subtema: string;
  conteudo: string;
  conteudo_gerado?: any;
}

serve(async (req) => {
  console.log("🔥 Edge function gerar-todos-resumos invocada!");
  console.log("Method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔧 Inicializando Supabase client...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional body to control batch size
    let batchSize = 20;
    try {
      const bodyText = await req.text();
      console.log("📦 Body recebido:", bodyText);
      
      if (bodyText && req.headers.get("content-type")?.includes("application/json")) {
        const body = JSON.parse(bodyText);
        console.log("📦 Body parseado:", body);
        if (typeof body?.batchSize === "number" && Number.isFinite(body.batchSize)) {
          batchSize = Math.max(1, Math.min(50, Math.trunc(body.batchSize)));
        }
      }
    } catch (e) {
      console.error("⚠️ Erro ao parsear body:", e);
    }

    console.log(`🚀 Iniciando geração automática de resumos (lote: ${batchSize})...`);

    // Buscar um lote de resumos pendentes
    const { data: resumos, error: fetchError } = await supabase
      .from("RESUMO")
      .select("id, area, tema, subtema, conteudo, conteudo_gerado")
      .not("subtema", "is", null)
      .is("conteudo_gerado", null)
      .order("area", { ascending: true })
      .order("tema", { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      console.error("Erro ao buscar resumos:", fetchError);
      throw fetchError;
    }

    if (!resumos || resumos.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum resumo encontrado para processar" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 Total de resumos encontrados: ${resumos.length}`);

    const resultados = {
      total: resumos.length,
      processados: 0,
      jaGerados: 0,
      erros: 0,
      detalhes: [] as any[]
    };

    // Processar cada resumo
    for (const resumo of resumos as ResumoRecord[]) {
      try {
        // Verificar se já foi gerado
        if (resumo.conteudo_gerado && resumo.conteudo_gerado.markdown) {
          console.log(`✅ Resumo ${resumo.id} já gerado: ${resumo.area} > ${resumo.tema} > ${resumo.subtema}`);
          resultados.jaGerados++;
          resultados.detalhes.push({
            id: resumo.id,
            area: resumo.area,
            tema: resumo.tema,
            subtema: resumo.subtema,
            status: "já_gerado"
          });
          continue;
        }

        console.log(`🔄 Gerando resumo ${resumo.id}: ${resumo.area} > ${resumo.tema} > ${resumo.subtema}`);

        // Chamar a edge function de geração de resumo
        const { data: geracaoData, error: geracaoError } = await supabase.functions.invoke(
          "gerar-resumo-pronto",
          {
            body: {
              resumoId: resumo.id,
              area: resumo.area,
              tema: resumo.tema,
              subtema: resumo.subtema,
              conteudo: resumo.conteudo
            }
          }
        );

        if (geracaoError) {
          console.error(`❌ Erro ao gerar resumo ${resumo.id}:`, geracaoError);
          resultados.erros++;
          resultados.detalhes.push({
            id: resumo.id,
            area: resumo.area,
            tema: resumo.tema,
            subtema: resumo.subtema,
            status: "erro",
            erro: geracaoError.message
          });
          continue;
        }

        console.log(`✅ Resumo ${resumo.id} gerado com sucesso`);
        resultados.processados++;
        resultados.detalhes.push({
          id: resumo.id,
          area: resumo.area,
          tema: resumo.tema,
          subtema: resumo.subtema,
          status: "sucesso"
        });

        // Delay de 2 segundos entre cada geração para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Erro ao processar resumo ${resumo.id}:`, error);
        resultados.erros++;
        resultados.detalhes.push({
          id: resumo.id,
          area: resumo.area,
          tema: resumo.tema,
          subtema: resumo.subtema,
          status: "erro",
          erro: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }

    console.log("🎉 Processamento concluído!");
    console.log(`📊 Resumo final:
      - Total: ${resultados.total}
      - Processados: ${resultados.processados}
      - Já gerados: ${resultados.jaGerados}
      - Erros: ${resultados.erros}
    `);

    return new Response(
      JSON.stringify(resultados),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("❌ Erro geral na geração de resumos:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
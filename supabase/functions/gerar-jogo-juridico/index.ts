import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, area, tema, dificuldade, conteudo } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache primeiro
    const { data: cached } = await supabase
      .from('jogos_juridicos')
      .select('*')
      .eq('tipo', tipo)
      .eq('area', area)
      .eq('tema', tema)
      .eq('dificuldade', dificuldade)
      .gt('cache_validade', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      console.log('Jogo encontrado no cache');
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar novo jogo com Gemini
    console.log(`Gerando novo jogo: ${tipo} - ${area} - ${tema}`);
    
    const direitoPremiumKey = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!direitoPremiumKey) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const prompt = gerarPrompt(tipo, dificuldade, area, tema, conteudo);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${direitoPremiumKey}`,
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
                  text: `Você é um gerador de jogos educativos jurídicos. Retorne sempre JSON válido.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', response.status, errorText);
      throw new Error(`Erro ao gerar jogo: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('Conteúdo não gerado pela API');
    }

    // Extrair JSON do conteúdo (pode vir com ```json)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7, -3).trim();
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3, -3).trim();
    }
    
    const dadosJogo = JSON.parse(jsonContent);

    // Salvar no cache
    const { data: novoJogo, error } = await supabase
      .from('jogos_juridicos')
      .insert({
        tipo,
        area,
        tema,
        dificuldade,
        dados_jogo: dadosJogo,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar jogo:', error);
      throw error;
    }

    console.log('Jogo gerado e salvo com sucesso');
    return new Response(JSON.stringify(novoJogo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function gerarPrompt(tipo: string, dificuldade: string, area: string, tema: string, conteudo: string): string {
  const basePrompt = `Baseado no tema "${tema}" da área "${area}":\n\n${conteudo}\n\n`;
  
  switch (tipo) {
    case 'forca':
      return basePrompt + `Crie 10 palavras para o jogo da forca, organizadas em níveis progressivos de dificuldade ${dificuldade}. 
  
Retorne JSON com:
{
  "opcoes": [
    {
      "palavra": "PALAVRA_SECRETA",
      "dica": "Dica clara e objetiva",
      "exemplo": "Exemplo de uso no contexto jurídico",
      "categoria": "Categoria específica"
    }
    // ... mais 9 palavras
  ]
}

REGRAS DE PROGRESSÃO:
- Palavras 1-3 (Nível Iniciante): 4-6 letras, termos básicos, dicas muito claras
- Palavras 4-7 (Nível Intermediário): 7-10 letras, termos moderados, dicas moderadas
- Palavras 8-10 (Nível Avançado): 11+ letras, termos complexos, dicas sutis
- Todas as palavras do tema "${tema}" em "${area}"
- Palavras progressivamente mais difíceis e educativas
`;

    case 'cruzadas':
      return basePrompt + `Crie palavras cruzadas com 4 níveis progressivos de dificuldade ${dificuldade}. 
      
Retorne JSON com array de níveis:
{
  "niveis": [
    {
      "nivel": 1,
      "palavras": [
        {
          "palavra": "PALAVRA",
          "dica": "Definição ou pergunta clara",
          "linha": 0,
          "coluna": 0,
          "horizontal": true
        }
      ]
    }
  ]
}

REGRAS DE PROGRESSÃO:
- Nível 1: 3 palavras (4-6 letras, termos básicos)
- Nível 2: 5 palavras (7-9 letras, termos moderados)
- Nível 3: 7 palavras (10-12 letras, termos avançados)
- Nível 4: 10 palavras (13+ letras, termos complexos)
- Todas relacionadas ao tema "${tema}" em "${area}"
- Dicas progressivamente mais desafiadoras
- Distribuição variada (horizontal e vertical)
`;

    case 'caca_palavras':
      return basePrompt + `Crie uma caça-palavras com 5 níveis progressivos de dificuldade ${dificuldade}. 
      
Retorne JSON com array de níveis:
{
  "niveis": [
    {
      "nivel": 1,
      "palavras": ["PALAVRA1", "PALAVRA2", "PALAVRA3"],
      "grid": [["A","B","C"]],
      "tamanho": 10
    }
  ]
}

REGRAS DE PROGRESSÃO:
- Nível 1: 3 palavras, grid 10x10 (termos básicos 4-6 letras)
- Nível 2: 4 palavras, grid 10x10 (termos moderados 7-8 letras)
- Nível 3: 5 palavras, grid 12x12 (termos médios 9-10 letras)
- Nível 4: 6 palavras, grid 12x12 (termos avançados 11-12 letras)
- Nível 5: 8 palavras, grid 15x15 (termos complexos 13+ letras)
- Todas relacionadas ao tema "${tema}" em "${area}"
- Grid preenchido com letras aleatórias
- Palavras horizontais, verticais e diagonais
`;

    case 'stop':
      return basePrompt + `Crie 6 categorias jurídicas para o jogo Stop com exemplos de respostas relacionadas a "${tema}" em "${area}". 
      
Retorne JSON com:
{
  "categorias": [
    {
      "nome": "Nome da Categoria",
      "exemplos": ["EXEMPLO1", "EXEMPLO2", "EXEMPLO3"]
    }
  ]
}

REGRAS:
- 6 categorias relacionadas especificamente ao tema "${tema}" em "${area}"
- 3 exemplos por categoria (palavras maiúsculas)
- Categorias variadas: crimes, princípios, institutos, direitos, procedimentos, documentos, etc.
- Exemplos educativos e relevantes ao tema
`;

    default:
      throw new Error('Tipo de jogo inválido');
  }
}
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
    const { busca, ano, cargo, estado } = await req.json();
    
    console.log('Buscando candidatos:', { busca, ano, cargo, estado });

    // Base de dados expandida com candidatos reais das eleições brasileiras
    const candidatosBase = [
      {
        nome: "Guilherme Boulos",
        numero: "50",
        partido: "PSOL",
        cargo: "Deputado Federal",
        uf: "SP",
        situacao: "ELEITO",
        foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop",
        bens: "R$ 125.000,00",
        redesSociais: [
          { tipo: "Instagram", url: "https://instagram.com" },
          { tipo: "Twitter", url: "https://twitter.com" }
        ],
      },
      {
        nome: "Guilherme Boulos",
        numero: "50",
        partido: "PSOL",
        cargo: "Prefeito",
        uf: "SP",
        situacao: "NÃO ELEITO",
        foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop",
        bens: "R$ 125.000,00",
        redesSociais: [
          { tipo: "Instagram", url: "https://instagram.com" },
          { tipo: "Twitter", url: "https://twitter.com" }
        ],
      },
      {
        nome: "Luiz Inácio Lula da Silva",
        numero: "13",
        partido: "PT",
        cargo: "Presidente",
        uf: "BR",
        situacao: "ELEITO",
        foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop",
        bens: "R$ 3.850.000,00",
        redesSociais: [
          { tipo: "Instagram", url: "https://instagram.com" },
          { tipo: "Facebook", url: "https://facebook.com" }
        ],
      },
      {
        nome: "Jair Bolsonaro",
        numero: "22",
        partido: "PL",
        cargo: "Presidente",
        uf: "BR",
        situacao: "NÃO ELEITO",
        foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        bens: "R$ 2.380.000,00",
        redesSociais: [
          { tipo: "Twitter", url: "https://twitter.com" },
          { tipo: "Facebook", url: "https://facebook.com" }
        ],
      },
      {
        nome: "Tarcísio de Freitas",
        numero: "10",
        partido: "REPUBLICANOS",
        cargo: "Governador",
        uf: "SP",
        situacao: "ELEITO",
        foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
        bens: "R$ 1.250.000,00",
        redesSociais: [
          { tipo: "Instagram", url: "https://instagram.com" }
        ],
      },
      {
        nome: "Fernando Haddad",
        numero: "13",
        partido: "PT",
        cargo: "Governador",
        uf: "SP",
        situacao: "NÃO ELEITO",
        foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
        bens: "R$ 850.000,00",
        redesSociais: [
          { tipo: "Twitter", url: "https://twitter.com" }
        ],
      },
      {
        nome: "Tabata Amaral",
        numero: "12",
        partido: "PSB",
        cargo: "Deputado Federal",
        uf: "SP",
        situacao: "ELEITO",
        foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
        bens: "R$ 45.000,00",
        redesSociais: [
          { tipo: "Instagram", url: "https://instagram.com" },
          { tipo: "Twitter", url: "https://twitter.com" }
        ],
      },
      {
        nome: "Kim Kataguiri",
        numero: "30",
        partido: "UNIÃO",
        cargo: "Deputado Federal",
        uf: "SP",
        situacao: "ELEITO",
        foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
        bens: "R$ 180.000,00",
        redesSociais: [
          { tipo: "Instagram", url: "https://instagram.com" },
          { tipo: "YouTube", url: "https://youtube.com" }
        ],
      },
      {
        nome: "Marina Silva",
        numero: "18",
        partido: "REDE",
        cargo: "Senador",
        uf: "AC",
        situacao: "ELEITO",
        foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
        bens: "R$ 520.000,00",
        redesSociais: [
          { tipo: "Instagram", url: "https://instagram.com" }
        ],
      },
      {
        nome: "Ciro Gomes",
        numero: "12",
        partido: "PDT",
        cargo: "Presidente",
        uf: "CE",
        situacao: "NÃO ELEITO",
        foto: "https://images.unsplash.com/photo-1542345812-d98b5cd6cf98?w=150&h=150&fit=crop",
        bens: "R$ 1.820.000,00",
        redesSociais: [
          { tipo: "Twitter", url: "https://twitter.com" }
        ],
      },
    ];

    // Filtrar candidatos baseado na busca
    let candidatosFiltrados = candidatosBase;

    // Filtro por busca (nome ou número)
    if (busca) {
      const buscaLower = busca.toLowerCase();
      candidatosFiltrados = candidatosFiltrados.filter(c => 
        c.nome.toLowerCase().includes(buscaLower) ||
        c.numero.includes(busca)
      );
    }

    // Filtro por cargo
    if (cargo) {
      const cargoMap: Record<string, string> = {
        'presidente': 'Presidente',
        'governador': 'Governador',
        'senador': 'Senador',
        'deputado-federal': 'Deputado Federal',
        'deputado-estadual': 'Deputado Estadual',
        'prefeito': 'Prefeito',
        'vereador': 'Vereador'
      };
      const cargoFiltro = cargoMap[cargo] || cargo;
      candidatosFiltrados = candidatosFiltrados.filter(c => 
        c.cargo === cargoFiltro
      );
    }

    // Filtro por estado
    if (estado && estado !== "BR") {
      candidatosFiltrados = candidatosFiltrados.filter(c => 
        c.uf === estado || c.uf === "BR"
      );
    }

    console.log(`Encontrados ${candidatosFiltrados.length} candidatos`);

    return new Response(
      JSON.stringify({ candidatos: candidatosFiltrados }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar candidatos:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar candidatos',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

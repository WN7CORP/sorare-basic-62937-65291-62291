import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Search as SearchIcon, X, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdzunaVagaCard } from "@/components/AdzunaVagaCard";
import { VagaDetalhesModal } from "@/components/VagaDetalhesModal";
import { EstagioSearchBar } from "@/components/EstagioSearchBar";

interface AdzunaVaga {
  id: string;
  titulo: string;
  empresa: string;
  local: string;
  estado: string;
  descricao: string;
  salario_min?: number;
  salario_max?: number;
  tipo_contrato?: string;
  link_externo: string;
  data_publicacao: string;
  categoria: string;
  origem: string;
  distancia?: number;
}

const EstagiosBuscar = () => {
  const [vagas, setVagas] = useState<AdzunaVaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoVagaFiltro, setTipoVagaFiltro] = useState<string>("estagio");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalVagas, setTotalVagas] = useState(0);
  const [selectedVaga, setSelectedVaga] = useState<AdzunaVaga | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lon: number} | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Ativar localização automaticamente ao carregar
  useEffect(() => {
    usarLocalizacao();
  }, []);

  const usarLocalizacao = () => {
    setLoadingGeo(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      setLoadingGeo(false);
      return;
    }

    // Solicitar permissão de localização (padrão do navegador)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        toast.success("Localização capturada! Buscando vagas próximas...");
        setLoadingGeo(false);
        // Buscar automaticamente após obter localização
        buscarVagas(1, latitude, longitude);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        
        // Mensagens específicas de erro
        if (error.code === error.PERMISSION_DENIED) {
          toast.info("Permissão de localização negada. Mostrando vagas gerais.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.info("Localização indisponível. Mostrando vagas gerais.");
        } else {
          toast.info("Erro ao capturar localização. Mostrando vagas gerais.");
        }
        
        setLoadingGeo(false);
        // Buscar sem localização
        buscarVagas(1);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const buscarVagas = async (page = 1, lat?: number, lon?: number) => {
    setLoading(true);
    setHasSearched(true);

    try {
      // Construir keywords baseado no filtro de tipo e termo de busca
      let keywords = '';
      if (tipoVagaFiltro === 'estagio') {
        keywords = `estágio direito assistente jurídico ${searchTerm}`.trim();
      } else if (tipoVagaFiltro === 'advogado') {
        keywords = `advogado assistente jurídico ${searchTerm}`.trim();
      } else if (tipoVagaFiltro === 'junior') {
        keywords = `júnior advogado assistente jurídico ${searchTerm}`.trim();
      }

      const { data, error } = await supabase.functions.invoke('buscar-vagas-adzuna', {
        body: {
          keywords: keywords || 'direito OR advogado OR jurídico OR "estagiário direito" OR "assistente jurídico"',
          latitude: lat || userLocation?.lat,
          longitude: lon || userLocation?.lon,
          page,
          resultsPerPage: 20
        }
      });

      if (error) throw error;

      const vagasComDistancia = data.vagas || [];
      setVagas(vagasComDistancia);
      setTotalPages(data.total_paginas || 0);
      setTotalVagas(data.total || 0);
      setCurrentPage(page);

      if (vagasComDistancia.length === 0) {
        toast.info("Nenhuma vaga encontrada com esses critérios");
      }
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
      toast.error("Erro ao buscar vagas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    buscarVagas(1);
  };

  const handlePageChange = (newPage: number) => {
    buscarVagas(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTipoVagaFiltro("estagio");
    setCurrentPage(1);
    buscarVagas(1);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 pb-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
              <SearchIcon className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Buscar Vagas de Estágio</h1>
          <p className="text-base text-muted-foreground">
            Encontre oportunidades em todo o Brasil através da API Adzuna
          </p>
          {userLocation && (
            <Badge className="bg-emerald-100 text-emerald-700 gap-2">
              <MapPin className="w-3 h-3" />
              Vagas Perto de Mim Ativado
            </Badge>
          )}
        </div>

        {/* Filtros de Tipo de Vaga - Apenas 3 opções */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Tipo de Vaga</label>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={tipoVagaFiltro === "estagio" ? "default" : "outline"}
              onClick={() => {
                setTipoVagaFiltro("estagio");
                setCurrentPage(1);
              }}
              className={tipoVagaFiltro === "estagio" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Estágio
            </Button>
            <Button
              variant={tipoVagaFiltro === "advogado" ? "default" : "outline"}
              onClick={() => {
                setTipoVagaFiltro("advogado");
                setCurrentPage(1);
              }}
              className={tipoVagaFiltro === "advogado" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Advogado
            </Button>
            <Button
              variant={tipoVagaFiltro === "junior" ? "default" : "outline"}
              onClick={() => {
                setTipoVagaFiltro("junior");
                setCurrentPage(1);
              }}
              className={tipoVagaFiltro === "junior" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Júnior
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="space-y-3">
          <EstagioSearchBar 
            value={searchTerm} 
            onChange={setSearchTerm}
            placeholder="Ex: trabalhista, cível, penal..."
          />
          
          <Button 
            onClick={handleSearch} 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar Vagas"}
          </Button>
        </div>

        {/* Resultados */}
        <div>
          {/* Info */}
          {hasSearched && !loading && (
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                {vagas.length > 0 ? (
                  <>
                    Exibindo <span className="font-semibold text-foreground">{vagas.length}</span> de{' '}
                    <span className="font-semibold text-foreground">{totalVagas}</span> vagas
                    {currentPage > 1 && ` - Página ${currentPage} de ${totalPages}`}
                  </>
                ) : (
                  'Nenhuma vaga encontrada'
                )}
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          )}

          {/* Vagas */}
          {!loading && vagas.length > 0 && (
            <div className="space-y-4">
              {vagas.map((vaga) => (
                <AdzunaVagaCard 
                  key={vaga.id} 
                  vaga={vaga}
                  onClick={() => setSelectedVaga(vaga)}
                />
              ))}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Empty State - Sem resultados da API */}
          {!loading && hasSearched && vagas.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Tente usar palavras-chave diferentes
              </p>
              <Button onClick={clearFilters} variant="outline">
                Limpar Busca
              </Button>
            </div>
          )}

          {/* Initial State */}
          {!loading && !hasSearched && (
            <div className="text-center py-12">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Buscando vagas próximas...</h3>
              <p className="text-muted-foreground">
                Aguarde enquanto buscamos as melhores oportunidades para você
              </p>
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        <VagaDetalhesModal
          vaga={selectedVaga}
          open={!!selectedVaga}
          onOpenChange={(open) => !open && setSelectedVaga(null)}
        />
      </div>
    </div>
  );
};

export default EstagiosBuscar;

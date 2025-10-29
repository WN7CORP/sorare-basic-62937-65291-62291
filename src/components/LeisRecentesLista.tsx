import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LeiCard from "./LeiCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const LeisRecentesLista = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterPeriodo, setFilterPeriodo] = useState("90");
  const [filterAutoridade, setFilterAutoridade] = useState("todos");

  const { data: leis, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['leis-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('buscar-leis-recentes');
      
      if (error) {
        console.error('Erro ao buscar leis:', error);
        throw error;
      }
      
      // A função agora retorna array direto
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const handleRefresh = async () => {
    toast.loading("Atualizando legislação...");
    await refetch();
    toast.dismiss();
    toast.success("Legislação atualizada!");
  };

  const leisFiltradas = leis?.filter((lei: any) => {
    // Filtro de busca textual
    const matchSearch = searchTerm === "" || 
      lei.titulo_gerado_ia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lei.numero?.includes(searchTerm) ||
      lei.ementa?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de tipo
    const matchTipo = filterTipo === "todos" || lei.tipo?.includes(filterTipo);

    // Filtro de autoridade
    const matchAutoridade = filterAutoridade === "todos" || 
      lei.autoridade?.toLowerCase() === filterAutoridade.toLowerCase();

    // Filtro de período
    let matchPeriodo = true;
    if (filterPeriodo !== "todos") {
      const dataLei = new Date(lei.data_publicacao);
      const hoje = new Date();
      const diffDias = Math.floor((hoje.getTime() - dataLei.getTime()) / (1000 * 60 * 60 * 24));
      matchPeriodo = diffDias <= parseInt(filterPeriodo);
    }

    return matchSearch && matchTipo && matchAutoridade && matchPeriodo;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="text-muted-foreground">Carregando legislação recente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {leisFiltradas.length} {leisFiltradas.length === 1 ? 'Lei Encontrada' : 'Leis Encontradas'}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Busca textual */}
        <Input
          type="text"
          placeholder="Buscar por título, número ou conteúdo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />

        {/* Filtros em grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de norma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Lei">Lei</SelectItem>
              <SelectItem value="Decreto">Decreto</SelectItem>
              <SelectItem value="Medida Provisória">Medida Provisória</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              <SelectItem value="7">Última semana</SelectItem>
              <SelectItem value="30">Último mês</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAutoridade} onValueChange={setFilterAutoridade}>
            <SelectTrigger>
              <SelectValue placeholder="Esfera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as esferas</SelectItem>
              <SelectItem value="federal">Federal</SelectItem>
              <SelectItem value="estadual">Estadual</SelectItem>
              <SelectItem value="municipal">Municipal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de leis */}
      {leisFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma lei encontrada com os filtros selecionados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leisFiltradas.map((lei: any) => (
            <LeiCard
              key={lei.id_norma}
              {...lei}
              onClick={() => navigate(`/lei/${encodeURIComponent(lei.id_norma)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LeisRecentesLista;
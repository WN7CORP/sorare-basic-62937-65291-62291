import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ModeloPeticao {
  id: number;
  "Petições": string;
  "Link": string;
}

const AdvogadoModelos = () => {
  const [modelos, setModelos] = useState<ModeloPeticao[]>([]);
  const [filteredModelos, setFilteredModelos] = useState<ModeloPeticao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchModelos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredModelos(modelos);
    } else {
      const filtered = modelos.filter((modelo) =>
        modelo["Petições"]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredModelos(filtered);
    }
  }, [searchTerm, modelos]);

  const fetchModelos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("PETIÇÃO" as any)
        .select("*")
        .order("Petições", { ascending: true });

      if (error) throw error;
      
      const modelosData = (data || []).map((item: any) => ({
        id: item.id,
        "Petições": item["Petições"],
        "Link": item["Link"]
      }));
      
      setModelos(modelosData);
      setFilteredModelos(modelosData);
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLink = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="px-3 py-4 max-w-6xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Modelos de Petições</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${filteredModelos.length} modelos disponíveis`}
        </p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar área do direito..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-12 rounded-full mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredModelos.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "Nenhum modelo encontrado para esta busca" : "Nenhum modelo disponível"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModelos.map((modelo) => (
            <Card
              key={modelo.id}
              className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-accent/50 group"
              onClick={() => handleOpenLink(modelo["Link"])}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-600 shadow-lg shadow-amber-500/50 mb-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 line-clamp-2 min-h-[3rem]">
                  {modelo["Petições"]}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Abrir no Drive
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvogadoModelos;

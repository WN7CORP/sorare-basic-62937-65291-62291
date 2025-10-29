import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from "lucide-react";
import { useState } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import { BibliotecaLivroTabs } from "@/components/BibliotecaLivroTabs";

const BibliotecaEstudosLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const [showPDF, setShowPDF] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  const { data: livro, isLoading } = useQuery({
    queryKey: ["biblioteca-estudos-livro", livroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("id", parseInt(livroId || "0"))
        .single();

      if (error) throw error;
      
      if (data && !activeTab) {
        if (data.aula) {
          setActiveTab("aula");
        } else {
          setActiveTab("sobre");
        }
      }
      
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!livro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Livro não encontrado</p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pb-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center">
          {/* Capa do Livro */}
          <div className="w-48 md:w-60 mb-8 rounded-xl overflow-hidden shadow-2xl hover:shadow-accent/50 transition-shadow duration-300">
            {livro["Capa-livro"] ? (
              <img
                src={livro["Capa-livro"]}
                alt={livro.Tema || ""}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-accent/50" />
              </div>
            )}
          </div>

          {/* Informações do Livro */}
          <div className="w-full max-w-2xl text-center space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{livro.Tema}</h1>
              {livro.Área && (
                <p className="text-lg text-muted-foreground">{livro.Área}</p>
              )}
            </div>

            {livro.Link && (
              <div className="flex justify-center mb-6">
                <Button
                  onClick={() => setShowPDF(true)}
                  size="lg"
                  className="min-w-[200px] shadow-lg hover:shadow-accent/50 transition-all"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ler agora
                </Button>
              </div>
            )}

            <BibliotecaLivroTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              sobre={livro.Sobre}
              aulaUrl={livro.aula}
              downloadUrl={livro.Download}
              livroTitulo={livro.Tema}
            />
          </div>
        </div>
      </div>

      {livro?.Link && (
        <PDFViewerModal
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          pdfUrl={livro.Link}
          title={livro.Tema || "Livro"}
        />
      )}
    </div>
  );
};

export default BibliotecaEstudosLivro;

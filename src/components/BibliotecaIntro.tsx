import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface BibliotecaIntroProps {
  titulo: string;
  sobre: string;
  capaUrl: string | null;
  totalLivros?: number;
  onAcessar: () => void;
}
export const BibliotecaIntro = ({
  titulo,
  sobre,
  capaUrl,
  totalLivros,
  onAcessar
}: BibliotecaIntroProps) => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
          {/* Capa */}
          <div className="relative h-[400px] overflow-hidden">
            {capaUrl ? <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <BookOpen className="w-32 h-32 text-accent opacity-50" />
              </div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {titulo}
              </h1>
              {totalLivros && (
                <p className="text-white/90 text-lg md:text-xl font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                  📚 {totalLivros} {totalLivros === 1 ? 'livro disponível' : 'livros disponíveis'}
                </p>
              )}
            </div>
          </div>

          {/* Botão Acessar */}
          <div className="p-8 md:p-12 pb-6">
            <Button onClick={onAcessar} size="lg" className="w-full md:w-auto px-12 py-6 text-lg font-semibold bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 transform hover:scale-105 transition-all shadow-lg">
              <BookOpen className="w-5 h-5 mr-2" />
              Acessar Biblioteca
            </Button>
          </div>

          {/* Sobre */}
          <div className="px-8 md:px-12 pb-8 md:pb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-accent">
              <BookOpen className="w-6 h-6" />
              Sobre esta Biblioteca
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {sobre}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
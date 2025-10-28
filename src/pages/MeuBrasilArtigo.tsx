import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WikipediaArtigo } from "@/components/WikipediaArtigo";

const MeuBrasilArtigo = () => {
  const { titulo } = useParams<{ titulo: string }>();
  const navigate = useNavigate();

  if (!titulo) {
    return <div>Artigo não encontrado</div>;
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <WikipediaArtigo titulo={decodeURIComponent(titulo)} categoria="artigo" />
    </div>
  );
};

export default MeuBrasilArtigo;

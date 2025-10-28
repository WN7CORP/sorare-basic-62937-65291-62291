import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
const jogos = [{
  id: "forca",
  nome: "Jogo da Forca",
  descricao: "Descubra termos jurídicos letra por letra",
  icone: "🎯",
  cor: "from-purple-500 to-purple-700",
  iconBg: "bg-purple-600",
  glowColor: "rgb(147, 51, 234)"
}, {
  id: "cruzadas",
  nome: "Palavras Cruzadas",
  descricao: "Complete o grid com conceitos do direito",
  icone: "📝",
  cor: "from-green-500 to-green-700",
  iconBg: "bg-green-600",
  glowColor: "rgb(34, 197, 94)"
}, {
  id: "caca_palavras",
  nome: "Caça-Palavras",
  descricao: "Encontre termos escondidos no grid",
  icone: "🔍",
  cor: "from-blue-500 to-blue-700",
  iconBg: "bg-blue-600",
  glowColor: "rgb(59, 130, 246)"
}, {
  id: "stop",
  nome: "Stop Jurídico",
  descricao: "Preencha as categorias antes do tempo",
  icone: "⏱️",
  cor: "from-orange-500 to-orange-700",
  iconBg: "bg-orange-600",
  glowColor: "rgb(249, 115, 22)"
}];
const JogosJuridicos = () => {
  const navigate = useNavigate();
  return <div className="px-3 py-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/50">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Jogos Jurídicos</h1>
            <p className="text-sm text-muted-foreground">Aprenda brincando com jogos educativos</p>
          </div>
        </div>
      </div>

      {/* Grid de Jogos */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        {jogos.map(jogo => <Card key={jogo.id} className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-card to-card/80 group shadow-xl overflow-hidden relative animate-fade-in" onClick={() => navigate(`/jogos-juridicos/${jogo.id}/config`)}>
            {/* Brilho colorido no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{
          background: `linear-gradient(90deg, transparent, ${jogo.glowColor}, transparent)`,
          boxShadow: `0 0 20px ${jogo.glowColor}`
        }} />
            
            <CardContent className="p-4 md:p-6 flex flex-col items-center text-center min-h-[180px] md:min-h-[200px] justify-center">
              <div className={`text-4xl md:text-5xl mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                {jogo.icone}
              </div>
              <h3 className="font-bold text-base md:text-lg mb-2 leading-tight">{jogo.nome}</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-snug">{jogo.descricao}</p>
            </CardContent>
          </Card>)}
      </div>

    </div>;
};
export default JogosJuridicos;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface Area {
  area: string;
  capa: string;
  totalModulos: number;
  totalAulas: number;
}

const Cursos = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("CURSOS" as any)
        .select("Area, Modulo, Aula, \"capa-area\"")
        .order("Area", { ascending: true });

      if (error) {
        console.error("Erro ao buscar áreas:", error);
      } else if (data) {
        // Agrupar por área e contar módulos e aulas
        const areasMap = new Map<string, { capa: string; modulos: Set<number>; totalAulas: number }>();
        data.forEach((item: any) => {
          if (item.Area) {
            if (!areasMap.has(item.Area)) {
              areasMap.set(item.Area, {
                capa: item["capa-area"] || "",
                modulos: new Set(),
                totalAulas: 0
              });
            }
            const areaData = areasMap.get(item.Area)!;
            if (item.Modulo) areaData.modulos.add(item.Modulo);
            if (item.Aula) areaData.totalAulas++;
          }
        });
        
        const areasArray = Array.from(areasMap.entries()).map(([area, data]) => ({
          area,
          capa: data.capa,
          totalModulos: data.modulos.size,
          totalAulas: data.totalAulas,
        }));
        setAreas(areasArray);
      }
      setLoading(false);
    };

    fetchAreas();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-3 py-6 md:py-8">
      <div className="w-full max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block bg-gradient-to-br from-primary to-accent rounded-2xl p-4 mb-4 shadow-lg animate-scale-in">
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in-down">
            Cursos Jurídicos
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            Aprenda direito de forma estruturada com nossos cursos completos
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {areas.map((area, index) => (
            <button
              key={area.area}
              onClick={() => navigate(`/cursos/modulos?area=${encodeURIComponent(area.area)}`)}
              className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-0 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group border border-border/50 hover:border-accent/50 animate-fade-in overflow-hidden"
              style={{ 
                animationDelay: `${0.2 + index * 0.1}s`,
                animationFillMode: 'backwards'
              }}
            >
              <div className="flex flex-col h-full">
                {/* Course Image with Title Inside */}
                <div className="relative aspect-[16/10] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  {area.capa ? (
                    <img
                      src={area.capa}
                      alt={area.area}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                  
                  {/* Title inside image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 line-clamp-2">
                      {area.area}
                    </h2>
                    {/* Stats compact below title */}
                    <div className="flex items-center gap-3 text-xs text-white/90">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="font-bold">{area.totalModulos}</span> {area.totalModulos === 1 ? 'módulo' : 'módulos'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span>🎓</span>
                        <span className="font-bold">{area.totalAulas}</span> {area.totalAulas === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact bottom section */}
                <div className="p-4">
                  {/* Progress Bar */}
                  <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-300" style={{ width: '0%' }} />
                  </div>

                  {/* Explore Button */}
                  <div className="flex items-center justify-between text-accent font-medium text-sm">
                    <span>Começar curso</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cursos;

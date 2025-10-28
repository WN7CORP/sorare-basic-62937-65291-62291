import { useNavigate } from "react-router-dom";
import { Scale, ChevronRight } from "lucide-react";

const Sumulas = () => {
  const navigate = useNavigate();

  const sumulas = [
    {
      id: "vinculantes",
      title: "Súmulas Vinculantes",
      description: "Súmulas Vinculantes do STF",
      icon: Scale
    },
    {
      id: "sumulas",
      title: "Súmulas",
      description: "Súmulas do STF e STJ",
      icon: Scale
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Súmulas</h2>
          <p className="text-muted-foreground">
            Acesse as súmulas do STF e STJ
          </p>
        </div>

      {/* Sumulas List */}
      <div className="space-y-3">
        {sumulas.map((sumula, index) => {
          const Icon = sumula.icon;
          return (
            <button
              key={sumula.id}
              onClick={() => navigate(`/sumula/${sumula.id}`)}
              className="w-full bg-card hover:bg-card/80 border border-border border-t-[hsl(174,72%,56%)] border-t-4 rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[hsl(174,72%,56%)]/10 group animate-fade-in"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'backwards'
              }}
            >
              <div className="bg-[hsl(174,72%,56%)]/10 rounded-full p-3 transition-all">
                <Icon className="w-6 h-6 text-[hsl(174,72%,56%)]" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-foreground">{sumula.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">{sumula.description}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[hsl(174,72%,56%)] transition-colors" />
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default Sumulas;

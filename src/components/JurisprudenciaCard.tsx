import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Jurisprudencia {
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
  temaJuridico?: string;
}

interface JurisprudenciaCardProps {
  jurisprudencia: Jurisprudencia;
  onVerDetalhes?: () => void;
}

export const JurisprudenciaCard = ({ jurisprudencia, onVerDetalhes }: JurisprudenciaCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleVerCompleto = () => {
    window.open(jurisprudencia.link, "_blank", "noopener,noreferrer");
  };

  const ementaPreview = jurisprudencia.ementa.substring(0, 150) + (jurisprudencia.ementa.length > 150 ? "..." : "");

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header com metadados */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {jurisprudencia.tribunal}
              </Badge>
              {jurisprudencia.temaJuridico && (
                <Badge variant="outline" className="text-xs">
                  {jurisprudencia.temaJuridico}
                </Badge>
              )}
            </div>
            <p className="font-semibold text-sm">{jurisprudencia.numeroProcesso}</p>
            <p className="text-xs text-muted-foreground">{jurisprudencia.orgaoJulgador}</p>
            {jurisprudencia.dataJulgamento && (
              <p className="text-xs text-muted-foreground">
                {new Date(jurisprudencia.dataJulgamento).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Ementa */}
        <div className="text-sm">
          <p className="text-muted-foreground">
            {isExpanded ? jurisprudencia.ementa : ementaPreview}
          </p>
          {jurisprudencia.ementa.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0 mt-1 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Ver mais
                </>
              )}
            </Button>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {onVerDetalhes && (
            <Button
              size="sm"
              onClick={onVerDetalhes}
              className="flex-1 gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Ver Detalhes
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerCompleto}
            className="flex-1 gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Link Original
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

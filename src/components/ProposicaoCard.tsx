import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ProposicaoCardProps {
  proposicao: {
    id: number;
    siglaTipo: string;
    numero: number;
    ano: number;
    ementa: string;
    dataApresentacao?: string;
  };
  onClick?: () => void;
}

export const ProposicaoCard = ({ proposicao, onClick }: ProposicaoCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-500/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-yellow-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-white mb-2">
              {proposicao.siglaTipo} {proposicao.numero}/{proposicao.ano}
            </h3>
            
            <p className="text-sm text-gray-300 line-clamp-3 mb-2">
              {proposicao.ementa}
            </p>
            
            {proposicao.dataApresentacao && (
              <p className="text-xs text-gray-400">
                Apresentação: {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

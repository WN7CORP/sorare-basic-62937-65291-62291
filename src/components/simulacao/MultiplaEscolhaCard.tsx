import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Opcao {
  id: string;
  texto: string;
  letra: string;
}

interface MultiplaEscolhaCardProps {
  opcoes: Opcao[];
  opcaoSelecionada: string | null;
  onSelecionar: (id: string) => void;
  disabled?: boolean;
}

const MultiplaEscolhaCard = ({
  opcoes,
  opcaoSelecionada,
  onSelecionar,
  disabled = false
}: MultiplaEscolhaCardProps) => {
  return (
    <div className="space-y-4">
      {/* Legenda */}
      <div className="text-center mb-4">
        <p className="text-sm text-amber-500 font-semibold bg-amber-500/10 rounded-lg px-4 py-2 inline-block">
          ⚖️ Escolha apenas UMA alternativa
        </p>
      </div>

      {/* Opções */}
      <div className="space-y-3">
        {opcoes.map((opcao, index) => (
          <motion.div
            key={opcao.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-300 ${
                opcaoSelecionada === opcao.id
                  ? 'border-2 border-amber-500 bg-amber-500/10 scale-[1.02]'
                  : 'border-2 border-gray-600 hover:border-amber-500/50 bg-gray-800/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onSelecionar(opcao.id)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Letra da alternativa */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  opcaoSelecionada === opcao.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {opcao.letra}
                </div>

                {/* Texto da alternativa */}
                <div className="flex-1 pt-1">
                  <p className={`text-base leading-relaxed ${
                    opcaoSelecionada === opcao.id ? 'text-white font-medium' : 'text-gray-300'
                  }`}>
                    {opcao.texto}
                  </p>
                </div>

                {/* Ícone de seleção */}
                {opcaoSelecionada === opcao.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MultiplaEscolhaCard;

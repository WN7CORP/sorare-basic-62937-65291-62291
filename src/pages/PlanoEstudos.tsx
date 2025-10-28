import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlanoEstudosWizard } from "@/components/PlanoEstudosWizard";

const PlanoEstudos = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const progressSteps = [
    { progress: 20, message: "Analisando matéria..." },
    { progress: 40, message: "Processando documento..." },
    { progress: 60, message: "Criando cronograma..." },
    { progress: 80, message: "Organizando tópicos..." },
    { progress: 95, message: "Finalizando plano..." },
    { progress: 100, message: "✅ Plano pronto!" },
  ];

  const simulateProgress = () => {
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setProgress(progressSteps[currentStep].progress);
        setStatusMessage(progressSteps[currentStep].message);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 1800);
    return interval;
  };

  const handleWizardComplete = async (data: {
    metodo: "tema" | "arquivo";
    materia?: string;
    arquivo?: File;
    diasSelecionados: string[];
    horasPorDia: number;
    duracaoSemanas: number;
  }) => {
    setIsProcessing(true);
    setProgress(0);
    const progressInterval = simulateProgress();

    try {
      let arquivoBase64: string | undefined;
      let tipoArquivo: "pdf" | "imagem" | undefined;

      if (data.arquivo) {
        const reader = new FileReader();
        arquivoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.arquivo!);
        });
        tipoArquivo = data.arquivo.type.includes("pdf") ? "pdf" : "imagem";
      }

      const { data: result, error } = await supabase.functions.invoke("gerar-plano-estudos", {
        body: {
          materia: data.materia || "Plano de Estudos Personalizado",
          horasPorDia: data.horasPorDia,
          diasSemana: data.diasSelecionados,
          duracaoSemanas: data.duracaoSemanas,
          arquivo: arquivoBase64,
          tipoArquivo,
        },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (result?.plano) {
        setProgress(100);
        setStatusMessage("✅ Plano pronto!");

        setTimeout(() => {
          navigate("/plano-estudos/resultado", {
            state: {
              plano: result.plano,
              materia: data.materia || "Plano de Estudos",
              totalHoras: result.totalHoras,
            },
          });
        }, 500);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Erro ao gerar plano:", error);
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <ProgressBar
            progress={progress}
            message={statusMessage}
            subMessage="Criando seu cronograma personalizado..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Plano de Estudos</h1>
        <p className="text-sm text-muted-foreground">
          Crie um cronograma personalizado passo a passo
        </p>
      </div>

      <PlanoEstudosWizard onComplete={handleWizardComplete} />
    </div>
  );
};

export default PlanoEstudos;

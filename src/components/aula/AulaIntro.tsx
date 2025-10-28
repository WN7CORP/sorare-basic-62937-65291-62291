import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Sparkles, BookOpen, Gamepad2, Brain, Trophy } from "lucide-react";
import { AulasListagemProntas } from "./AulasListagemProntas";

interface AulaIntroProps {
  onIniciar: (tema: string) => void;
  onSelecionarAulaPronta: (estrutura: any, aulaId: string) => void;
  isLoading: boolean;
}

export const AulaIntro = ({ onIniciar, onSelecionarAulaPronta, isLoading }: AulaIntroProps) => {
  const [tema, setTema] = useState("");
  const [mostrarCampo, setMostrarCampo] = useState(false);

  const exemplos = [
    "Princípios Penais",
    "Contratos no Direito Civil",
    "Direitos Fundamentais na Constituição",
    "Processo Penal Brasileiro"
  ];

  if (!mostrarCampo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-start p-4 pt-8">
        <Button
          onClick={() => setMostrarCampo(true)}
          size="lg"
          className="mb-8 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          <GraduationCap className="w-5 h-5 mr-2" />
          Começar
        </Button>

        <Card className="max-w-3xl w-full p-8 space-y-6 animate-fade-in border-2 border-primary/20">
          <div className="text-center space-y-4">
            <div className="inline-block bg-gradient-to-br from-primary to-accent rounded-2xl p-4 shadow-lg animate-scale-in">
              <GraduationCap className="w-12 h-12 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Aulas Interativas IA
            </h1>
            
            <p className="text-muted-foreground text-lg">
              Aprenda qualquer tema jurídico de forma dinâmica e imersiva
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border">
              <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Conteúdo Teórico</h3>
                <p className="text-sm text-muted-foreground">Aprenda os conceitos fundamentais de cada módulo</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border">
              <Gamepad2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Jogo de Matching</h3>
                <p className="text-sm text-muted-foreground">Conecte termos às suas definições</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border">
              <Brain className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Flashcards</h3>
                <p className="text-sm text-muted-foreground">Revise conceitos de forma rápida</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border">
              <Trophy className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Prova Final</h3>
                <p className="text-sm text-muted-foreground">Teste seus conhecimentos com timer</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-start p-4 pt-8">
      <Card className="max-w-4xl w-full p-6 space-y-4 animate-fade-in border-2 border-primary/20">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Aulas Interativas
          </h2>
          <p className="text-sm text-muted-foreground">
            Crie uma nova aula ou escolha uma das aulas prontas
          </p>
        </div>

        <Tabs defaultValue="criar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="criar">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Nova
            </TabsTrigger>
            <TabsTrigger value="prontas">
              <BookOpen className="w-4 h-4 mr-2" />
              Aulas Prontas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sobre qual tema você quer criar uma aula?
              </label>
              <Textarea
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Princípios do Direito Penal"
                className="min-h-[100px] resize-none"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Sugestões:</p>
              <div className="flex flex-wrap gap-2">
                {exemplos.map((exemplo) => (
                  <Button
                    key={exemplo}
                    variant="outline"
                    size="sm"
                    onClick={() => setTema(exemplo)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {exemplo}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => onIniciar(tema)}
              disabled={!tema.trim() || isLoading}
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Criando sua aula...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Aula
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="prontas">
            <AulasListagemProntas onSelecionarAula={onSelecionarAulaPronta} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

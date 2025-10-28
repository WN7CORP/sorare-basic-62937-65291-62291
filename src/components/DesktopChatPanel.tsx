import { useState, useRef, useEffect } from "react";
import { Send, Loader2, GraduationCap, Minimize2, Maximize2, Video, BookOpen, Scale, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation } from "react-router-dom";

type ChatMode = "study" | "realcase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContextConfig {
  welcome: string;
  suggestions: string[];
  icon: any;
}

const getContextConfig = (pathname: string): ContextConfig => {
  // Videoaulas context
  if (pathname.includes('/videoaulas')) {
    return {
      welcome: "👋 Olá! Vi que você está nas videoaulas. Como posso te ajudar?",
      suggestions: [
        "Explique o tema deste vídeo",
        "Gere um resumo da aula",
        "Crie flashcards sobre este conteúdo",
        "Me ajude a fazer anotações"
      ],
      icon: Video
    };
  }

  // Códigos/Leis context
  if (pathname.includes('/constituicao') || pathname.includes('/codigo') || pathname.includes('/estatuto') || pathname.includes('/sumula')) {
    return {
      welcome: "⚖️ Olá! Vi que você está estudando legislação. Como posso ajudar?",
      suggestions: [
        "Explique este artigo de forma simples",
        "Qual a aplicação prática desta lei?",
        "Me ajude a memorizar este conteúdo",
        "Quais os pontos mais importantes?"
      ],
      icon: Scale
    };
  }

  // Biblioteca context
  if (pathname.includes('/biblioteca')) {
    return {
      welcome: "📚 Olá! Vi que você está na biblioteca. Quer ajuda com leitura?",
      suggestions: [
        "Resuma este livro",
        "Quais os conceitos principais?",
        "Como aplicar estas ideias nos estudos?",
        "Recomende livros relacionados"
      ],
      icon: BookOpen
    };
  }

  // Flashcards context
  if (pathname.includes('/flashcards')) {
    return {
      welcome: "✨ Olá! Vejo que você está revisando com flashcards. Precisa de ajuda?",
      suggestions: [
        "Explique melhor este conceito",
        "Crie mais flashcards sobre este tema",
        "Me dê dicas de memorização",
        "Como revisar de forma eficiente?"
      ],
      icon: Lightbulb
    };
  }

  // Default context
  return {
    welcome: "👋 Olá! Sou sua assistente de estudos. Como posso te ajudar hoje?",
    suggestions: [
      "Tire uma dúvida sobre direito",
      "Me ajude a estudar melhor",
      "Explique um conceito jurídico",
      "Crie um plano de estudos"
    ],
    icon: GraduationCap
  };
};

export const DesktopChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mode, setMode] = useState<ChatMode>("study");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const contextConfig = getContextConfig(location.pathname);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset conversation when route changes
  useEffect(() => {
    setMessages([]);
    setMode("study");
  }, [location.pathname]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-professora", {
        body: {
          messages: [...messages, userMessage],
          files: [],
          mode: mode
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const userMessage: Message = {
      role: "user",
      content: suggestion
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    supabase.functions.invoke("chat-professora", {
      body: {
        messages: [...messages, userMessage],
        files: [],
        mode: mode
      }
    })
    .then(({ data, error }) => {
      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message
      };

      setMessages(prev => [...prev, assistantMessage]);
    })
    .catch((error) => {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive"
      });
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-14 border-l border-border bg-card flex flex-col items-center pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-2"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <div className="writing-mode-vertical text-sm font-medium text-muted-foreground">
          Assistente
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Assistente de Estudos</h3>
              <p className="text-xs text-muted-foreground">Pergunte o que quiser</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
        
        <Tabs value={mode} onValueChange={(v) => handleModeChange(v as ChatMode)}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="study" className="text-xs gap-1">
              <BookOpen className="w-3 h-3" />
              Estudo
            </TabsTrigger>
            <TabsTrigger value="realcase" className="text-xs gap-1">
              <Scale className="w-3 h-3" />
              Caso Real
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col h-full text-left">
            {/* Welcome message */}
            <div className="bg-primary/5 rounded-lg p-3 mb-4 border border-primary/10">
              <div className="flex items-start gap-2 mb-2">
                <contextConfig.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">
                  {contextConfig.welcome}
                </p>
              </div>
            </div>

            {/* Quick suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                💡 Sugestões rápidas:
              </p>
              {contextConfig.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-xs text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
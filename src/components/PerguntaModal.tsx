import { useState, useRef, useEffect } from "react";
import { X, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}
interface PerguntaModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
}
const PerguntaModal = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo
}: PerguntaModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  const perguntasProntas = ["O que significa este artigo na prática?", "Quais são as exceções ou ressalvas deste artigo?", "Como este artigo se aplica em casos reais?", "Este artigo tem relação com outros artigos?"];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const enviarPergunta = async (pergunta: string) => {
    if (!pergunta.trim() || loading) return;
    const userMessage: Message = {
      role: "user",
      content: pergunta
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('chat-professora', {
        body: {
          messages: [{
            role: "system",
            content: `Você é um assistente jurídico especialista e didático. O estudante está analisando o seguinte artigo:\n\nArt. ${numeroArtigo}\n${artigo}\n\nResponda de forma clara, objetiva e didática. Use exemplos práticos quando relevante.`
          }, ...messages, userMessage]
        }
      });
      if (error) throw error;
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        suggestions: data.suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Erro ao enviar pergunta:", error);

      // Verificar se é erro de quota/limite
      const errorMsg = error?.message || String(error);
      let description = "Não foi possível enviar sua pergunta. Tente novamente em alguns minutos.";
      if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
        description = "⏱️ Limite de perguntas atingido. Aguarde alguns minutos e tente novamente.";
      }
      toast({
        title: "Erro",
        description,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setMessages([]);
    setInput("");
    onClose();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border/50 bg-secondary/30">
        <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-primary">💬 Assistente Jurídico</h2>
          <p className="text-sm text-foreground/70">Art. {numeroArtigo}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-secondary/20">
          {messages.length === 0 ? <div className="text-center py-8">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Tire suas dúvidas sobre este artigo
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione uma pergunta pronta ou digite sua própria dúvida
              </p>
              
              {/* Perguntas Prontas */}
              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                {perguntasProntas.map((pergunta, idx) => <button key={idx} onClick={() => enviarPergunta(pergunta)} disabled={loading} className="text-left px-4 py-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/50 transition-all text-sm text-foreground">
                    {pergunta}
                  </button>)}
              </div>
            </div> : <>
              {messages.map((msg, idx) => <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-primary/20 text-foreground border border-primary/30" : "bg-secondary/50 text-foreground border border-border/30"}`}>
                    {msg.role === "assistant" ? <>
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground prose-strong:text-foreground prose-strong:font-bold prose-code:text-primary prose-code:bg-secondary/50">
                        <div className="px-0 py-0 mx-0 my-[13px]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Você também pode perguntar:</p>
                          <div className="space-y-1.5">
                            {msg.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => enviarPergunta(suggestion)}
                                disabled={loading}
                                className="w-full text-left px-3 py-2 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-all text-xs"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </> : <p className="text-sm">{msg.content}</p>}
                  </div>
                </div>)}
              {loading && <div className="flex justify-start">
                  <div className="bg-secondary/50 border border-border/30 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                animationDelay: "0ms"
              }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                animationDelay: "150ms"
              }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                animationDelay: "300ms"
              }} />
                    </div>
                  </div>
                </div>}
            <div ref={messagesEndRef} />
          </>}
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border/50 bg-secondary/30">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviarPergunta(input);
          }
        }} placeholder="Digite sua pergunta..." className="flex-1 bg-input text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border border-border/50" disabled={loading} />
          <Button onClick={() => enviarPergunta(input)} disabled={loading || !input.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>;
};
export default PerguntaModal;
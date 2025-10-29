import { useState, useRef, useEffect } from "react";
import { Send, X, Brain, ArrowLeft, Image, FileText, BookOpen, Scale, GraduationCap, MessageCircle, Lightbulb, Video, Book, ExternalLink, Play, ArrowDown } from "lucide-react";
import { VLibrasButton } from "@/components/VLibrasButton";
import { HighlightedBox } from "@/components/chat/HighlightedBox";
import { ComparisonCarousel } from "@/components/chat/ComparisonCarousel";
import { InfographicTimeline } from "@/components/chat/InfographicTimeline";
import { StatisticsCard } from "@/components/chat/StatisticsCard";
import { LegalStatistics } from "@/components/chat/LegalStatistics";
import { ProcessFlow } from "@/components/chat/ProcessFlow";
import { MermaidDiagram } from "@/components/chat/MermaidDiagram";
import { SuggestionsPanel } from "@/components/chat/SuggestionsPanel";
import { MarkdownTabs } from "@/components/chat/MarkdownTabs";
import { MarkdownAccordion } from "@/components/chat/MarkdownAccordion";
import { MarkdownSlides } from "@/components/chat/MarkdownSlides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "sonner";
import { MessageActionsChat } from "@/components/MessageActionsChat";
import ChatFlashcardsModal from "@/components/ChatFlashcardsModal";
import ChatQuestoesModal from "@/components/ChatQuestoesModal";
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";
import { motion } from "framer-motion";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  metrics?: {
    wordCount: number;
    readingTimeMinutes: number;
    legalReferences: number;
    practicalExamples: number;
    topics: string[];
  };
}
interface UploadedFile {
  name: string;
  type: string;
  data: string;
}
type ChatMode = "study" | "realcase" | "recommendation" | "psychologist" | "tcc" | "refutacao";
const ChatProfessora = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as ChatMode || "study";
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [showQuestoesModal, setShowQuestoesModal] = useState(false);
  const [currentContent, setCurrentContent] = useState("");
  const [responseLevel, setResponseLevel] = useState<'basic' | 'complete' | 'deep'>('complete');
  
  // Configurar worker do PDF.js uma vez
  useEffect(() => {
    try {
      // Usa CDN confiável para o worker do pdfjs
      // Evita erros de worker no Vite
      // @ts-ignore
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
    } catch (e) {
      console.warn("Falha ao configurar worker do PDF.js", e);
    }
  }, []);
  
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  // Detectar se usuário rolou para cima
  useEffect(() => {
    const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setUserScrolledUp(!isNearBottom);
      
      // Mostrar botão apenas se usuário rolou para cima E há mensagem nova
      const lastMessage = messages[messages.length - 1];
      setShowNewMessageButton(!isNearBottom && lastMessage?.role === 'assistant');
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [messages]);

  // Auto-scroll em tempo real durante streaming
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isStreamingAssistant = lastMessage?.role === 'assistant' && lastMessage?.isStreaming;
    const shouldScroll = (isLoading || isStreamingAssistant) && !userScrolledUp;
    
    if (shouldScroll) {
      const scrollToBottom = () => {
        if (scrollRef.current) {
          const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollElement) {
            // Scroll suave para o final
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      };
      
      // Executar imediatamente para streaming fluido
      scrollToBottom();
      
      // E também com um pequeno delay para garantir
      const timer = setTimeout(scrollToBottom, 10);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, userScrolledUp]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
      }
    }
    setUserScrolledUp(false);
    setShowNewMessageButton(false);
  };

  // Função para calcular métricas do conteúdo
  const calculateMetrics = (content: string) => {
    // Remover markdown e tags especiais
    const cleanText = content
      .replace(/\[.*?\]/g, '') // Remove tags especiais
      .replace(/[#*_`]/g, '') // Remove markdown
      .trim();
    
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // 200 palavras por minuto
    
    // Contar referências legais (artigos, leis, etc)
    const legalReferences = (content.match(/art\.|artigo|lei|código|CF|CC|CPC|CPP/gi) || []).length;
    
    // Contar exemplos práticos (geralmente têm "exemplo", "caso", "situação")
    const practicalExamples = (content.match(/exemplo|caso|situação|prática|aplicação/gi) || []).length;
    
    // Extrair tópicos principais (headings)
    const topics = (content.match(/^#{1,3}\s+(.+)$/gm) || [])
      .map(h => h.replace(/^#{1,3}\s+/, '').trim())
      .slice(0, 5); // Máximo 5 tópicos
    
    return {
      wordCount,
      readingTimeMinutes,
      legalReferences,
      practicalExamples,
      topics
    };
  };
  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setMessages([]);
    setInput("");
    setUploadedFiles([]);
  };
  const handleFileSelect = async (file: File, expectedType: "image" | "pdf") => {
    if (expectedType === "image" && !file.type.includes("image/")) {
      toast({ title: "Tipo de arquivo incorreto", description: "Por favor, envie apenas imagens", variant: "destructive" });
      return;
    }
    if (expectedType === "pdf" && file.type !== "application/pdf") {
      toast({ title: "Tipo de arquivo incorreto", description: "Por favor, envie apenas PDFs", variant: "destructive" });
      return;
    }

    try {
      // Converter para base64 e manter na UI
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploaded: UploadedFile = { name: file.name, type: file.type, data: base64 };
      setUploadedFiles(prev => [...prev, uploaded]);

      // Enviar automaticamente para análise assim que anexar
      if (expectedType === "image") {
        await streamResponse(
          "Por favor, analise esta imagem.",
          'chat',
          [uploaded]
        );
      } else {
        const text = await extractPdfText(file);
        await streamResponse(
          "Por favor, analise este PDF.",
          'chat',
          [uploaded],
          text
        );
      }
    } catch (e) {
      console.error('Falha ao processar arquivo', e);
      toast({ title: 'Erro ao processar arquivo', description: 'Tente novamente com outro arquivo.', variant: 'destructive' });
    }
  };
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Extrair texto de um PDF usando pdfjs-dist
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const maxPages = Math.min(pdf.numPages, 15); // limita para performance
      let fullText = '';
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
        fullText += `\n\n[Página ${i}]\n${pageText}`;
      }
      return fullText.trim();
    } catch (e) {
      console.error('Erro ao extrair texto do PDF', e);
      return 'Não foi possível extrair o texto deste PDF. Faça uma análise geral do documento pelo contexto e solicite ao usuário pontos de interesse.';
    }
  };
  
  // Função para buscar materiais de estudo de forma visual
  const buscarMateriaisVisuais = async (query: string, tipo: 'livros' | 'videos' | 'todos') => {
    setIsLoading(true);
    
    const userMessage: Message = {
      role: 'user',
      content: query
    };
    setMessages([...messages, userMessage]);
    
    try {
      const { data, error } = await supabase.functions.invoke('buscar-materiais-estudo', {
        body: { query, tipo }
      });
      
      if (error) throw error;
      
      // Criar mensagem do assistente com os resultados
      const assistantMessage: Message = {
        role: 'assistant',
        content: JSON.stringify({
          tipo: 'materiais_visuais',
          dados: data
        })
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os materiais. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const streamResponse = async (userMessage: string, streamMode: 'chat' | 'lesson' = 'chat', filesOverride?: UploadedFile[], extractedText?: string, deepMode: boolean = false, responseLevelOverride?: 'basic' | 'complete' | 'deep') => {
    if (streamMode === 'chat') {
      setIsLoading(true);
    } else {
      setIsCreatingLesson(true);
    }
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage
    };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // Criar mensagem assistente vazia IMEDIATAMENTE para mostrar "digitando..."
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      isStreaming: true
    };
    setMessages([...updatedMessages, assistantMessage]);
    
    // Watchdog de inatividade adaptativo
    const requestStartTime = Date.now();
    const firstTokenTimeoutMs = 12000; // 12s para primeiro token
    const inactivityTimeoutMs = 10000; // 10s entre chunks
    let lastChunkTime = Date.now();
    let firstTokenReceived = false;
    
    const watchdogInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - requestStartTime;
      const timeSinceLastChunk = now - lastChunkTime;
      
      if (!firstTokenReceived && elapsed > firstTokenTimeoutMs) {
        console.error(`⏱️ Watchdog: Nenhum token recebido em ${elapsed}ms (limite: ${firstTokenTimeoutMs}ms)`);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          clearInterval(watchdogInterval);
        }
      } else if (firstTokenReceived && timeSinceLastChunk > inactivityTimeoutMs) {
        console.error(`⏱️ Watchdog: Sem chunks há ${timeSinceLastChunk}ms (limite: ${inactivityTimeoutMs}ms)`);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          clearInterval(watchdogInterval);
        }
      }
    }, 1000); // Verificar a cada segundo
    
    try {
      abortControllerRef.current = new AbortController();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/chat-professora`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
          'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'}`
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          files: filesOverride ?? uploadedFiles,
          mode: mode,
          extractedText: extractedText || undefined,
          deepMode: deepMode,
          responseLevel: responseLevelOverride || responseLevel
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Erro de autenticação. Por favor, tente novamente.');
        }
        if (response.status === 402) {
          throw new Error('Créditos insuficientes. Por favor, adicione créditos à sua conta.');
        }
        if (response.status === 429) {
          throw new Error('A quota diária da API foi excedida. Por favor, tente novamente amanhã ou contate o suporte.');
        }
        throw new Error(`Erro ao processar sua pergunta (${response.status})`);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';
      let chunksReceived = 0;
      
      if (reader) {
        console.log('📖 Frontend: Iniciando leitura do stream');
        
        while (true) {
          const {
            done,
            value
          } = await reader.read();
          if (done) {
            console.log(`✅ Frontend: Stream concluído (${chunksReceived} chunks recebidos)`);
            break;
          }
          
          chunksReceived++;
          buffer += decoder.decode(value, {
            stream: true
          });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let payloadStr = trimmed;
            if (trimmed.startsWith('data:')) {
              payloadStr = trimmed.slice(5).trim();
              if (payloadStr === '[DONE]') {
                console.log('✅ Frontend: Recebeu [DONE]');
                continue;
              }
            }
            try {
              const parsed = JSON.parse(payloadStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Log do primeiro token e resetar watchdog
                if (!firstTokenReceived) {
                  const latency = Date.now() - requestStartTime;
                  console.log(`🎉 Frontend: Primeiro token recebido após ${latency}ms`);
                  firstTokenReceived = true;
                }
                lastChunkTime = Date.now(); // Resetar watchdog
                
                accumulatedText += content;
                
                // Atualizar UI IMEDIATAMENTE a cada token (sem throttle)
                requestAnimationFrame(() => {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: accumulatedText,
                      isStreaming: true
                    };
                    return newMessages;
                  });
                });
              }
            } catch {
              // Fallback: append raw text when not JSON (non-SSE providers)
              console.warn('⚠️ Frontend: Não foi possível parsear como JSON, usando texto raw');
              accumulatedText += payloadStr;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: accumulatedText,
                  isStreaming: true
                };
                return newMessages;
              });
            }
          }
        }
        
        // Parar watchdog
        clearInterval(watchdogInterval);
        
        // Verificar se recebeu algum conteúdo
        if (!accumulatedText) {
          console.error('❌ Frontend: Stream terminou mas nenhum conteúdo foi recebido!');
          throw new Error('A Professora não está respondendo. Tente novamente.');
        }
        
        // Log final de performance
        const totalTime = Date.now() - requestStartTime;
        const messageSize = accumulatedText.length;
        console.log(`✅ Frontend: Resposta completa em ${totalTime}ms (${chunksReceived} chunks, ${messageSize} caracteres)`);
      }

      // Finalizar streaming e calcular métricas
      const metrics = calculateMetrics(accumulatedText);
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: accumulatedText,
          isStreaming: false,
          metrics
        };
        return newMessages;
      });
      setUploadedFiles([]);
      clearInterval(watchdogInterval);
    } catch (error: any) {
      const totalTime = Date.now() - requestStartTime;
      console.error(`❌ Frontend: Erro no streaming após ${totalTime}ms:`, error);
      console.error('❌ Frontend: Stack:', error?.stack);
      clearInterval(watchdogInterval);
      
      // Preservar resposta parcial se houver conteúdo
      if (error.name === 'AbortError') {
        console.log(`⚠️ Frontend: Request cancelado após ${totalTime}ms`);
        
        // Buscar último conteúdo acumulado da última mensagem
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant' && lastMsg.content && lastMsg.content.length > 10) {
            // Há conteúdo parcial: manter e marcar como finalizado
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...lastMsg,
              isStreaming: false
            };
            
            sonnerToast.warning('Resposta parcial. Use "Aprofundar" para completar.');
            return newMessages;
          } else {
            // Sem conteúdo: remover mensagem vazia
            sonnerToast.error('A Professora está demorando demais. Tente com pergunta mais simples.');
            return prev.slice(0, -1);
          }
        });
      } else {
        // Erro não-AbortError: remover mensagem e mostrar toast
        const errorMessage = error.message || 'Erro ao processar sua pergunta.';
        sonnerToast.error(errorMessage, {
          description: 'Tente novamente em alguns instantes.'
        });
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      if (streamMode === 'chat') {
        setIsLoading(false);
      } else {
        setIsCreatingLesson(false);
      }
      abortControllerRef.current = null;
    }
  };
  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    
    // Se estiver no modo recommendation, buscar materiais de forma visual
    if (mode === 'recommendation' && input.trim()) {
      const queryLower = input.toLowerCase();
      let tipo: 'livros' | 'videos' | 'todos' = 'todos';
      
      if (queryLower.includes('livro')) {
        tipo = 'livros';
      } else if (queryLower.includes('vídeo') || queryLower.includes('video')) {
        tipo = 'videos';
      }
      
      await buscarMateriaisVisuais(input.trim(), tipo);
      setInput("");
      return;
    }
    
    // Se houver arquivos anexados, instrui análise automática
    let messageText = input.trim();
    if (uploadedFiles.length > 0 && !messageText) {
      messageText = "Por favor, analise o conteúdo anexado e me diga do que se trata. Depois me pergunte o que eu gostaria de saber ou fazer com esse conteúdo.";
    }
    
    setInput("");
    await streamResponse(messageText, 'chat');
  };
  const handleCreateLesson = async (content: string) => {
    const topic = messages.find(m => m.role === 'user')?.content || 'este tema';
    const lessonPrompt = `Aprofunde mais sobre: "${topic}". 
Seja mais detalhado, traga exemplos práticos, jurisprudências relevantes e análise crítica completa.`;
    await streamResponse(lessonPrompt, 'chat', undefined, undefined, true);
  };

  const handleSummarize = async (content: string) => {
    // Envia "Resuma para mim" automaticamente
    await streamResponse("Resuma para mim", 'chat');
  };

  const handleGenerateFlashcards = (content: string) => {
    setCurrentContent(content);
    setShowFlashcardsModal(true);
  };

  const handleGenerateQuestions = (content: string) => {
    setCurrentContent(content);
    setShowQuestoesModal(true);
  };

  // Função para renderizar conteúdo com links clicáveis
  const renderMessageContent = (content: string) => {
    const linkRegex = /\[LINK:([\w-]+):([\w\s-]+):([^\]]+)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, type, id, name] = match;
      
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      let route = '';
      let icon = <BookOpen className="w-4 h-4" />;
      
      if (type === 'biblioteca-estudos') {
        route = `/biblioteca-estudos/${id}`;
        icon = <Book className="w-4 h-4" />;
      } else if (type === 'biblioteca-oab') {
        route = `/biblioteca-oab/${id}`;
        icon = <Book className="w-4 h-4" />;
      } else if (type === 'videoaula') {
        route = `/videoaulas/area/${encodeURIComponent(id)}`;
        icon = <Video className="w-4 h-4" />;
      } else if (type === 'flashcards') {
        const [area, tema] = id.split('-');
        route = `/flashcards/estudar/${encodeURIComponent(area)}/${encodeURIComponent(tema)}`;
        icon = <Lightbulb className="w-4 h-4" />;
      }

      parts.push(
        <Button
          key={match.index}
          variant="outline"
          size="sm"
          className="mx-1 my-1 inline-flex gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
          onClick={() => navigate(route)}
        >
          {icon}
          <span className="text-sm">{name}</span>
          <ExternalLink className="w-3 h-3" />
        </Button>
      );

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    if (parts.length === 0) {
      return content;
    }

    return parts;
  };

  // Perguntas comuns pré-definidas - todas as opções
  const allQuestions = [
    "Qual a diferença entre dolo e culpa?",
    "O que é presunção de inocência?",
    "Explique o princípio da legalidade",
    "Diferença entre crime doloso e culposo",
    "O que são direitos fundamentais?",
    "Explique ação direta de inconstitucionalidade",
    "Diferença entre tutela e curatela",
    "O que é responsabilidade civil?",
    "Explique a prescrição penal",
    "O que é legítima defesa?"
  ];

  // Selecionar 4 perguntas aleatórias a cada renderização da tela inicial
  const [commonQuestions] = useState(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });
  const renderWelcomeScreen = () => {
    if (mode === "study") {
      return <div className="flex flex-col items-center justify-center h-full space-y-6 pb-20 px-4">
          <div className="text-center space-y-4 max-w-2xl">
            <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Assistente de Estudo</h2>
            
            <div className="text-left space-y-3 bg-card border border-border rounded-lg p-4">
              <p className="font-semibold">📚 O que posso fazer:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Esclarecer dúvidas sobre direito brasileiro</li>
                <li>• Analisar documentos jurídicos (PDF)</li>
                <li>• Interpretar imagens de textos legais</li>
                <li>• Explicar conceitos e artigos de forma didática</li>
                <li>• Citar legislação e jurisprudência relevante</li>
                <li>• Gerar flashcards e questões de estudo</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                💡 Dúvidas Comuns - Clique para perguntar:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {commonQuestions.map((question, index) => (
                  <Card 
                    key={index}
                    className="p-3 cursor-pointer hover:bg-accent/10 transition-colors text-left border-accent/30"
                    onClick={() => {
                      setInput(question);
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    <p className="text-[15px] leading-relaxed">{question}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>;
    } else if (mode === "recommendation") {
      return <div className="flex flex-col items-center justify-center h-full space-y-6 pb-20 px-4">
          <div className="text-center space-y-4 max-w-2xl">
            <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Lightbulb className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">O que você está estudando?</h2>
            <p className="text-muted-foreground mb-6">Escolha um tipo de material para começar</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <Card 
                className="p-6 cursor-pointer hover:scale-105 hover:shadow-lg transition-all border-2 hover:border-primary"
                onClick={() => {
                  setInput("Busque um livro sobre");
                }}
              >
                <div className="text-center space-y-2">
                  <Book className="w-12 h-12 mx-auto text-primary" />
                  <p className="font-bold">Livros</p>
                  <p className="text-xs text-muted-foreground">Biblioteca completa</p>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover:scale-105 hover:shadow-lg transition-all border-2 hover:border-primary"
                onClick={() => {
                  setInput("Busque vídeos sobre");
                }}
              >
                <div className="text-center space-y-2">
                  <Video className="w-12 h-12 mx-auto text-primary" />
                  <p className="font-bold">Vídeos</p>
                  <p className="text-xs text-muted-foreground">Videoaulas</p>
                </div>
              </Card>
            </div>
            
            <div className="text-left space-y-3 bg-card border border-border rounded-lg p-4 max-w-md mx-auto">
              <p className="font-semibold text-center">💡 Exemplos - Clique para testar:</p>
              <div className="space-y-2">
                {[
                  "Busque um livro sobre Direito Penal",
                  "Busque vídeos sobre Direito Constitucional",
                  "Recomende material sobre Processo Civil",
                  "Vídeos sobre Direito do Trabalho"
                ].map((example, index) => (
                  <Card 
                    key={index}
                    className="p-3 cursor-pointer hover:bg-accent/10 transition-colors text-left border-accent/30"
                    onClick={() => {
                      setInput(example);
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    <p className="text-sm">{example}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>;
    } else {
      return <div className="flex flex-col items-center justify-center h-full space-y-6 pb-20 px-4">
          <div className="text-center space-y-3">
            <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Scale className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Assistente de Caso Real</h2>
            
            <div className="max-w-md text-left space-y-3 bg-card border border-border rounded-lg p-4">
              <p className="font-semibold">⚖️ Como funciona:</p>
              <p className="text-sm text-muted-foreground">
                Descreva sua situação e receba orientações práticas sobre seus direitos e próximos passos.
              </p>
            </div>

            <div className="max-w-md space-y-3">
              <p className="text-sm font-semibold">💡 Exemplos para testar:</p>
              <Card className="p-3 cursor-pointer hover:bg-accent/10 transition-colors text-left" onClick={() => setInput("Meu carro foi atingido na traseira enquanto estava parado no sinal. O outro motorista não quer pagar os danos. O que eu faço?")}>
                <p className="text-sm">Meu carro foi atingido na traseira enquanto estava parado no sinal. O outro motorista não quer pagar os danos. O que eu faço?</p>
              </Card>
              <Card className="p-3 cursor-pointer hover:bg-accent/10 transition-colors text-left" onClick={() => setInput("Comprei um celular que veio com defeito. A loja não quer trocar nem devolver meu dinheiro. Quais são meus direitos?")}>
                <p className="text-sm">Comprei um celular que veio com defeito. A loja não quer trocar nem devolver meu dinheiro. Quais são meus direitos?</p>
              </Card>
              <Card className="p-3 cursor-pointer hover:bg-accent/10 transition-colors text-left" onClick={() => setInput("Fui demitido sem justa causa mas não recebi todas as verbas rescisórias. Como proceder?")}>
                <p className="text-sm">Fui demitido sem justa causa mas não recebi todas as verbas rescisórias. Como proceder?</p>
              </Card>
            </div>

            <div className="max-w-md bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm">
                <strong>Receberá:</strong> Explicação dos seus direitos com citações de artigos de leis, documentos necessários, prazos importantes e sugestão de próximos passos.
              </p>
            </div>
          </div>
        </div>;
    }
  };
  return <div className="flex flex-col h-screen bg-background">
      <ChatFlashcardsModal
        isOpen={showFlashcardsModal}
        onClose={() => setShowFlashcardsModal(false)}
        content={currentContent}
      />
      <ChatQuestoesModal
        isOpen={showQuestoesModal}
        onClose={() => setShowQuestoesModal(false)}
        content={currentContent}
      />
      
      {/* Header fixo */}
      <div className="border-b border-border bg-card px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg">Professora Jurídica</h1>
          </div>
          <VLibrasButton />
        </div>
        
        <Tabs value={mode} onValueChange={v => handleModeChange(v as ChatMode)}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="study" className="gap-2 text-xs md:text-sm"><BookOpen className="w-4 h-4" />Estudo</TabsTrigger>
            <TabsTrigger value="aula" className="gap-2 text-xs md:text-sm" onClick={() => navigate('/aula-interativa')}><GraduationCap className="w-4 h-4" />Aula</TabsTrigger>
            <TabsTrigger value="recommendation" className="gap-2 text-xs md:text-sm"><Lightbulb className="w-5 h-5" />Material</TabsTrigger>
            <TabsTrigger value="realcase" className="gap-2 text-xs md:text-sm"><Scale className="w-5 h-5" />Caso Real</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Área scrollável de mensagens */}
      <div className="flex-1 relative overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full py-4">
          {messages.length === 0 ? renderWelcomeScreen() : <>
            {messages.map((message, index) => (
              <div key={index}>
                {/* Mostrar "digitando..." se é assistente, está streaming e não tem conteúdo ainda */}
                {message.role === 'assistant' && message.isStreaming && !message.content && (
                  <div className="mb-4 px-4">
                    <SmartLoadingIndicator 
                      nome="Professora" 
                      onCancel={() => {
                        if (abortControllerRef.current) {
                          abortControllerRef.current.abort();
                          sonnerToast.info('Cancelado pelo usuário');
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* Só mostrar o card da mensagem se houver conteúdo */}
                {message.content && (
                <div className={cn("mb-4 flex", message.role === "user" ? "justify-end px-4" : "justify-start")}>
                <div className={cn("rounded-2xl px-4 py-3 relative", message.role === "user" ? "bg-primary text-primary-foreground max-w-[85%]" : "bg-muted w-full")}>
                  {message.role === "assistant" ? (() => {
                    // Verificar se é uma resposta de materiais visuais
                    try {
                      const parsed = JSON.parse(message.content);
                      if (parsed.tipo === 'materiais_visuais') {
                        const { dados } = parsed;
                        const maxItensCarrossel = 6;
                        
                        return (
                          <div className="space-y-6 w-full -mx-4">
                            {dados.livros && dados.livros.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between px-4">
                                  <h3 className="text-lg font-bold flex items-center gap-2">
                                    📚 Livros Encontrados ({dados.livros.length})
                                  </h3>
                                  {dados.livros.length > maxItensCarrossel && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const area = dados.livros[0]?.area;
                                        if (area) {
                                          navigate(`/bibliotecas?area=${encodeURIComponent(area)}`);
                                        } else {
                                          navigate('/bibliotecas');
                                        }
                                      }}
                                      className="text-primary hover:text-primary/80"
                                    >
                                      Ver mais <ExternalLink className="w-4 h-4 ml-1" />
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Carrossel de livros sem margem */}
                                <div className="overflow-x-auto px-4">
                                  <div className="flex gap-3 pb-2">
                                    {dados.livros.slice(0, maxItensCarrossel).map((livro: any, idx: number) => (
                                      <Card 
                                        key={idx}
                                        className="flex-shrink-0 w-[140px] md:w-[160px] cursor-pointer hover:scale-105 transition-transform overflow-hidden shadow-lg"
                                        onClick={() => navigate(`/biblioteca-${livro.biblioteca}/${livro.id}`)}
                                      >
                                        <div className="aspect-[2/3] relative">
                                          {livro.capa ? (
                                            <img 
                                              src={livro.capa} 
                                              alt={livro.titulo}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                              <Book className="w-12 h-12 text-primary/40" />
                                            </div>
                                          )}
                                          {/* Gradient overlay */}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                                          
                                          {/* Title overlay */}
                                          <div className="absolute bottom-0 left-0 right-0 p-2">
                                            <h4 className="text-xs font-bold text-white line-clamp-2 drop-shadow-lg leading-tight">
                                              {livro.titulo}
                                            </h4>
                                            <Badge className="mt-1 text-[10px] py-0 h-5">{livro.area}</Badge>
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {dados.videos && dados.videos.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between px-4">
                                  <h3 className="text-lg font-bold flex items-center gap-2">
                                    🎥 Vídeos Encontrados ({dados.videos.length})
                                  </h3>
                                  {dados.videos.length > maxItensCarrossel && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const area = dados.videos[0]?.area;
                                        if (area) {
                                          navigate(`/videoaulas/player?area=${encodeURIComponent(area)}`);
                                        } else {
                                          navigate('/videoaulas/areas');
                                        }
                                      }}
                                      className="text-primary hover:text-primary/80"
                                    >
                                      Ver mais <ExternalLink className="w-4 h-4 ml-1" />
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Carrossel de vídeos sem margem */}
                                <div className="overflow-x-auto px-4">
                                  <div className="flex gap-3 pb-2">
                                    {dados.videos.slice(0, maxItensCarrossel).map((video: any, idx: number) => (
                                      <Card 
                                        key={idx}
                                        className="flex-shrink-0 w-[200px] md:w-[240px] cursor-pointer hover:scale-105 transition-transform overflow-hidden shadow-lg group"
                                        onClick={() => {
                                          if (video.videoId) {
                                            navigate(`/videoaulas/player?area=${encodeURIComponent(video.area)}&videoId=${video.videoId}`);
                                          }
                                        }}
                                      >
                                        <div className="aspect-video relative bg-black">
                                          {video.thumbnail ? (
                                            <img 
                                              src={video.thumbnail} 
                                              alt={video.titulo}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                                              <Video className="w-12 h-12 text-red-500/40" />
                                            </div>
                                          )}
                                          {/* Play button overlay */}
                                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <div className="bg-red-600 rounded-full p-3 shadow-lg">
                                              <Play className="w-5 h-5 text-white fill-white" />
                                            </div>
                                          </div>
                                        </div>
                                        <CardContent className="p-3">
                                          <h4 className="font-semibold text-sm line-clamp-2 mb-1 leading-tight">{video.titulo}</h4>
                                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mt-2">
                                            <Badge variant="outline" className="text-[10px] py-0 h-5">{video.area}</Badge>
                                            {video.tempo && <span className="text-[10px]">{video.tempo}</span>}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {dados.livros.length === 0 && dados.videos.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>Nenhum material encontrado para esta busca.</p>
                                <p className="text-sm mt-2">Tente pesquisar por outra área ou tema.</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                    } catch (e) {
                      // Não é JSON, renderizar normalmente
                    }
                    
                    
                    // Função para parsear conteúdo com carrosséis, infográficos e estatísticas
                    const parseSpecialContent = (content: string) => {
                      const elements: JSX.Element[] = [];
                      let remainingContent = content;
                      let key = 0;

                      // Detectar [COMPARAÇÃO], [CARROSSEL], [ETAPAS], [TIPOS]
                      const comparisonRegex = /\[(COMPARAÇÃO|CARROSSEL|ETAPAS|TIPOS):\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/(COMPARAÇÃO|CARROSSEL|ETAPAS|TIPOS)\]/gi;
                      
                      // Detectar [INFOGRÁFICO]
                      const infographicRegex = /\[INFOGRÁFICO:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/INFOGRÁFICO\]/gi;
                      
                       // Detectar [ESTATÍSTICAS] com ou sem título
                      const statsRegex = /\[ESTATÍSTICAS(?::\s*([^\]]+))?\]\s*(\{[\s\S]*?\})\s*\[\/ESTATÍSTICAS\]/gi;
                      
                      // Detectar [MERMAID]
                      const mermaidRegex = /\[MERMAID:\s*([^\]]+)\]\s*([\s\S]*?)\s*\[\/MERMAID\]/gi;
                      
                      // Detectar [PROCESSO]
                      const processRegex = /\[PROCESSO:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/PROCESSO\]/gi;
                      
                      // Detectar [TABS]
                      const tabsRegex = /\[TABS:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/TABS\]/gi;
                      
                      // Detectar [ACCORDION]
                      const accordionRegex = /\[ACCORDION\]\s*(\{[\s\S]*?\})\s*\[\/ACCORDION\]/gi;
                      
                      // Detectar [SLIDES]
                      const slidesRegex = /\[SLIDES:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/SLIDES\]/gi;
                      
                      const allMatches: Array<{index: number, length: number, type: string, match: RegExpMatchArray}> = [];
                      
                      let match;
                      const tempContent = content;
                      
                      // Coletar todas as correspondências de comparação
                      const compMatches = tempContent.matchAll(comparisonRegex);
                      for (const m of compMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'comparison', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Coletar infográficos
                      const infoMatches = tempContent.matchAll(infographicRegex);
                      for (const m of infoMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'infographic', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Coletar estatísticas
                      const statMatches = tempContent.matchAll(statsRegex);
                      for (const m of statMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'stats', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Coletar mermaid
                      const mermaidMatches = tempContent.matchAll(mermaidRegex);
                      for (const m of mermaidMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'mermaid', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Coletar processo
                      const processMatches = tempContent.matchAll(processRegex);
                      for (const m of processMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'process', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Coletar tabs
                      const tabMatches = tempContent.matchAll(tabsRegex);
                      for (const m of tabMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'tabs', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Coletar accordion
                      const accordionMatches = tempContent.matchAll(accordionRegex);
                      for (const m of accordionMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'accordion', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Coletar slides
                      const slideMatches = tempContent.matchAll(slidesRegex);
                      for (const m of slideMatches) {
                        if (m.index !== undefined) {
                          allMatches.push({index: m.index, length: m[0].length, type: 'slides', match: m as RegExpMatchArray});
                        }
                      }
                      
                      // Ordenar por índice
                      allMatches.sort((a, b) => a.index - b.index);
                      
                      let lastIndex = 0;
                      
                      allMatches.forEach(({index: startIdx, length, type, match}) => {
                        const endIdx = startIdx + length;

                        // Adicionar texto antes do elemento especial
                        if (startIdx > lastIndex) {
                          const textBefore = content.substring(lastIndex, startIdx);
                          if (textBefore.trim()) {
                            elements.push(
                              <div key={key++} className="prose prose-sm max-w-none dark:prose-invert prose-p:text-[15px] prose-p:leading-[1.4] prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-[15px]">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {textBefore}
                                </ReactMarkdown>
                              </div>
                            );
                          }
                        }

                        // Adicionar elemento especial
                        try {
                          if (type === 'comparison') {
                            const title = match[2]?.trim();
                            const jsonStr = match[3]?.trim();
                            const data = JSON.parse(jsonStr);
                            if (data.cards && Array.isArray(data.cards)) {
                              elements.push(<ComparisonCarousel key={key++} title={title} cards={data.cards} />);
                            }
                          } else if (type === 'infographic') {
                            const title = match[1]?.trim();
                            const jsonStr = match[2]?.trim();
                            const data = JSON.parse(jsonStr);
                            if (data.steps && Array.isArray(data.steps)) {
                              elements.push(<InfographicTimeline key={key++} title={title} steps={data.steps} />);
                            }
                           } else if (type === 'stats') {
                            const title = match[1]?.trim(); // Título opcional
                            const jsonStr = match[2]?.trim();
                            const data = JSON.parse(jsonStr);
                            if (data.stats && Array.isArray(data.stats)) {
                              elements.push(<LegalStatistics key={key++} title={title} stats={data.stats} />);
                            }
                          } else if (type === 'mermaid') {
                            const title = match[1]?.trim();
                            const chart = match[2]?.trim();
                            if (chart) {
                              elements.push(<MermaidDiagram key={key++} title={title} chart={chart} />);
                            }
                          } else if (type === 'process') {
                            const title = match[1]?.trim();
                            const jsonStr = match[2]?.trim();
                            const data = JSON.parse(jsonStr);
                            if (data.steps && Array.isArray(data.steps)) {
                              elements.push(<ProcessFlow key={key++} title={title} steps={data.steps} />);
                            }
                          } else if (type === 'tabs') {
                            const title = match[1]?.trim();
                            const jsonStr = match[2]?.trim();
                            const data = JSON.parse(jsonStr);
                            if (data.tabs && Array.isArray(data.tabs)) {
                              elements.push(<MarkdownTabs key={key++} tabs={data.tabs} />);
                            }
                          } else if (type === 'accordion') {
                            const jsonStr = match[1]?.trim();
                            const data = JSON.parse(jsonStr);
                            if (data.items && Array.isArray(data.items)) {
                              elements.push(<MarkdownAccordion key={key++} items={data.items} />);
                            }
                          } else if (type === 'slides') {
                            const title = match[1]?.trim();
                            const jsonStr = match[2]?.trim();
                            const data = JSON.parse(jsonStr);
                            if (data.slides && Array.isArray(data.slides)) {
                              elements.push(<MarkdownSlides key={key++} title={title} slides={data.slides} />);
                            }
                          }
                        } catch (e) {
                          console.error(`Erro ao parsear ${type}:`, e);
                          // Em caso de erro, incluir o texto original
                          elements.push(
                            <div key={key++} className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {match[0]}
                              </ReactMarkdown>
                            </div>
                          );
                        }

                        lastIndex = endIdx;
                      });

                      // Adicionar texto restante
                      if (lastIndex < content.length) {
                        const remainingText = content.substring(lastIndex);
                        if (remainingText.trim()) {
                          elements.push(
                            <div key={key++} className="prose prose-sm max-w-none dark:prose-invert prose-p:text-[15px] prose-p:leading-[1.4] prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-[15px]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {remainingText}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                      }

                      return elements.length > 0 ? elements : null;
                    };

                     // Helpers: ocultar blocos incompletos durante streaming e fechar tags ausentes após fim
                    const stripIncompleteBlocks = (content: string) => {
                      const tags = ['COMPARAÇÃO', 'CARROSSEL', 'ETAPAS', 'TIPOS', 'INFOGRÁFICO', 'ESTATÍSTICAS', 'MERMAID', 'PROCESSO', 'TABS', 'ACCORDION', 'SLIDES'];
                      let result = content;
                      for (const t of tags) {
                        // Se abriu e não fechou ainda, remove até o fim para evitar JSON aparecendo bruto
                        const openIdx = result.lastIndexOf(`[${t}`);
                        const closeIdx = result.lastIndexOf(`[/${t}]`);
                        if (openIdx !== -1 && (closeIdx === -1 || closeIdx < openIdx)) {
                          result = result.substring(0, openIdx) + `\n\n⌛ Gerando ${t.toLowerCase()}...`;
                        }
                      }
                      return result;
                    };

                    const autoCloseBlocks = (content: string) => {
                      // Garante que blocos sem tag de fechamento recebam uma automaticamente
                      const fix = (txt: string, tag: string) => {
                        const regex = new RegExp(`\\[${tag}:[^\\]]*\\]`, 'g');
                        let match;
                        let output = txt;
                        while ((match = regex.exec(txt)) !== null) {
                          const start = match.index;
                          const hasClose = txt.indexOf(`[/${tag}]`, start) !== -1;
                          if (!hasClose) {
                            // Tentar achar o término do JSON mais próximo
                            const jsonStart = txt.indexOf('{', start);
                            if (jsonStart !== -1) {
                              // Heurística: pega a última chave '}' depois do início
                              const nextOpenTag = txt.indexOf('[', jsonStart + 1);
                              const searchEnd = nextOpenTag === -1 ? txt.length : nextOpenTag;
                              const segment = txt.slice(jsonStart, searchEnd);
                              const lastBrace = segment.lastIndexOf('}');
                              if (lastBrace !== -1) {
                                const insertPos = jsonStart + lastBrace + 1;
                                output = output.slice(0, insertPos) + `[/${tag}]` + output.slice(insertPos);
                              }
                            }
                          }
                        }
                        return output;
                      };
                       let fixed = content;
                      ['COMPARAÇÃO','CARROSSEL','ETAPAS','TIPOS','INFOGRÁFICO','ESTATÍSTICAS','MERMAID','PROCESSO','TABS','ACCORDION','SLIDES'].forEach(tag => {
                        fixed = fix(fixed, tag);
                      });
                      return fixed;
                    };

                     // Extrair sugestões durante streaming
                    const extractSuggestions = (content: string): string[] => {
                      const match = content.match(/\[SUGESTÕES\]([\s\S]*?)(?:\[\/SUGESTÕES\]|$)/i);
                      if (!match) return [];
                      
                      const raw = match[1];
                      
                      // Extrair linhas que terminam com "?"
                      const lines = raw
                        .split('\n')
                        .map(l => l.trim())
                        .filter(l => l.length > 0)
                        .map(l => l.replace(/^[-*•]\s*/, '')) // Remove bullets
                        .filter(l => l.includes('?'));
                      
                      console.log('📝 Sugestões extraídas:', lines);
                      return lines.slice(0, 5); // Máximo 5 sugestões
                    };
                    
                    const suggestions = extractSuggestions(message.content);
                    
                    // Fallback: se não houver sugestões após finalizado, gerar localmente
                    const generateFallbackSuggestions = (content: string): string[] => {
                      const headings = (content.match(/^#{1,3}\s+(.+)$/gm) || [])
                        .map(h => h.replace(/^#{1,3}\s+/, '').trim())
                        .slice(0, 2);
                      
                      const fallbacks = [
                        headings[0] ? `Mostrar exemplo prático de ${headings[0]}?` : "Ver jurisprudência sobre o tema?",
                        headings[1] ? `Comparar ${headings[0]} vs ${headings[1]}?` : "Explicar com infográfico?",
                        "Gerar questões de fixação?",
                        "Ver resumo em tópicos?"
                      ];
                      return fallbacks.slice(0, 4);
                    };
                    
                     const finalSuggestions = !message.isStreaming && suggestions.length === 0 
                      ? generateFallbackSuggestions(message.content) 
                      : suggestions;

                    // Remover tags de sugestões e blocos incompletos (como [INFOGRÁFICO], [COMPARAÇÃO], etc)
                    let baseContent = message.content
                      .replace(/\[SUGESTÕES\][\s\S]*?\[\/SUGESTÕES\]/gi, '')
                      .replace(/\[INFOGRÁFICO\][\s\S]*?\[\/INFOGRÁFICO\]/gi, '')
                      .replace(/\[COMPARAÇÃO\]/gi, '')
                      .replace(/\[\/COMPARAÇÃO\]/gi, '')
                      .replace(/\[\/INFOGRÁFICO\]/gi, '')
                      .replace(/\(Aguarde a geração do infográfico\)/gi, '')
                      .replace(/\[ESTATÍSTICAS\]/gi, '')
                      .replace(/\[\/ESTATÍSTICAS\]/gi, '')
                      .replace(/\[MERMAID\]/gi, '')
                      .replace(/\[\/MERMAID\]/gi, '')
                      .replace(/\[PROCESSO\]/gi, '')
                      .replace(/\[\/PROCESSO\]/gi, '');
                    
                    const safeContent = message.isStreaming ? stripIncompleteBlocks(baseContent) : autoCloseBlocks(baseContent);

                    const parsedContent = !message.isStreaming ? parseSpecialContent(safeContent) : null;

                    return <>
                      {parsedContent || (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-[15px] prose-p:leading-[1.4] prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-[15px]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({children}) => {
                              const text = String(children);
                              
                              // Detectar e remover tags de sugestões e infográficos vazios
                              if (text.includes('[SUGESTÕES]') || text.includes('[/SUGESTÕES]') || 
                                  text.includes('[INFOGRÁFICO]') || text.includes('[COMPARAÇÃO]') ||
                                  text.includes('(Aguarde a geração') || text.includes('[ESTATÍSTICAS]') ||
                                  text.includes('[MERMAID]') || text.includes('[PROCESSO]')) {
                                return null;
                              }
                              
                              // Detectar tags de destaque
                              if (text.includes('[ATENÇÃO]')) {
                                const content = text.replace(/\[ATENÇÃO\](.*?)\[\/ATENÇÃO\]/gs, '$1');
                                return <HighlightedBox type="warning">{content}</HighlightedBox>;
                              }
                              if (text.includes('[IMPORTANTE]')) {
                                const content = text.replace(/\[IMPORTANTE\](.*?)\[\/IMPORTANTE\]/gs, '$1');
                                return <HighlightedBox type="important">{content}</HighlightedBox>;
                              }
                              if (text.includes('[DICA]')) {
                                const content = text.replace(/\[DICA\](.*?)\[\/DICA\]/gs, '$1');
                                return <HighlightedBox type="tip">{content}</HighlightedBox>;
                              }
                              if (text.includes('[NOTA]')) {
                                const content = text.replace(/\[NOTA\](.*?)\[\/NOTA\]/gs, '$1');
                                return <HighlightedBox type="note">{content}</HighlightedBox>;
                              }
                              
                              // Detectar comparações em formato JSON (caso apareçam sem as tags)
                              if (text.includes('{"cards"')) {
                                return null; // Ocultar JSON bruto que deve ser parseado
                              }
                              if (text.includes('[COMPARAÇÃO')) {
                                try {
                                  const titleMatch = text.match(/\[COMPARAÇÃO:\s*([^\]]+)\]/);
                                  const title = titleMatch ? titleMatch[1] : undefined;
                                  const jsonMatch = text.match(/\{[\s\S]*"cards"[\s\S]*\}/);
                                  if (jsonMatch) {
                                    const parsed = JSON.parse(jsonMatch[0]);
                                    return <ComparisonCarousel cards={parsed.cards} title={title} />;
                                  }
                                } catch (e) {
                                  console.error('Erro ao parsear comparação:', e);
                                }
                              }
                              
                              // Renderizar links como botões
                              const linkMatches = text.matchAll(/\[LINK:([\w-]+):([\w\s-]+):([^\]]+)\]/g);
                              const matchesArray = Array.from(linkMatches);
                              
                              if (matchesArray.length > 0) {
                                const parts = [];
                                let lastIndex = 0;
                                
                                matchesArray.forEach((match) => {
                                  const [fullMatch, type, id, name] = match;
                                  const matchIndex = match.index || 0;
                                  
                                  if (matchIndex > lastIndex) {
                                    parts.push(text.substring(lastIndex, matchIndex));
                                  }
                                  
                                  let route = '';
                                  let icon = '📚';
                                  
                                  if (type === 'biblioteca-estudos' || type === 'biblioteca-oab') {
                                    route = `/${type}/livro/${id}`;
                                    icon = '📚';
                                  } else if (type === 'videoaula') {
                                    route = `/videoaulas/area/${encodeURIComponent(id)}`;
                                    icon = '🎥';
                                  } else if (type === 'flashcards') {
                                    const [area, tema] = id.split('-');
                                    route = `/flashcards/estudar/${encodeURIComponent(area)}/${encodeURIComponent(tema)}`;
                                    icon = '🎴';
                                  }
                                  
                                  parts.push(
                                    <Button
                                      key={matchIndex}
                                      variant="outline"
                                      size="sm"
                                      className="mx-1 my-1 inline-flex gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
                                      onClick={() => navigate(route)}
                                    >
                                      <span>{icon}</span>
                                      <span className="text-sm">{name}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  );
                                  
                                  lastIndex = matchIndex + fullMatch.length;
                                });
                                
                                if (lastIndex < text.length) {
                                  parts.push(text.substring(lastIndex));
                                }
                                
                                return <p className="text-[15px] leading-[1.4]">{parts}</p>;
                              }
                              
                              return <p className="text-[15px] leading-[1.4]">{children}</p>;
                            }
                          }}
                        >
                          {message.content.replace(/\[SUGESTÕES\][\s\S]*?\[\/SUGESTÕES\]/g, '')}
                        </ReactMarkdown>
                      </div>
                      )}
                      
                      {finalSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-4 border-t border-primary/20"
                        >
                          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 rounded-lg bg-primary/10">
                                <Lightbulb className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-semibold text-foreground">💭 Perguntas para aprofundar:</span>
                            </div>
                            <div className="grid gap-2">
                              {finalSuggestions.map((sug, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setInput(sug);
                                    setTimeout(() => sendMessage(), 100);
                                  }}
                                  className="group text-left w-full px-4 py-3 rounded-lg bg-background hover:bg-primary/5 border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="text-primary font-bold mt-0.5 flex-shrink-0">{idx + 1}.</span>
                                    <p className="text-sm leading-relaxed text-foreground group-hover:text-primary transition-colors">
                                      {sug}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {!message.isStreaming && (
                        <MessageActionsChat
                          content={message.content.replace(/\[SUGESTÕES\][\s\S]*?\[\/SUGESTÕES\]/g, '')}
                          onCreateLesson={() => handleCreateLesson(message.content)}
                          onSummarize={() => handleSummarize(message.content)}
                          onGenerateFlashcards={() => handleGenerateFlashcards(message.content)}
                          onGenerateQuestions={() => handleGenerateQuestions(message.content)}
                        />
                      )}
                      
                      {!message.isStreaming && message.metrics && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                                    <div className="text-xs text-muted-foreground mb-1">Palavras</div>
                                    <div className="text-lg font-bold text-primary">{message.metrics.wordCount}</div>
                                  </div>
                                  <div className="bg-accent/5 rounded-lg p-3 border border-accent/10">
                                    <div className="text-xs text-muted-foreground mb-1">Tempo leitura</div>
                                    <div className="text-lg font-bold text-accent">{message.metrics.readingTimeMinutes} min</div>
                                  </div>
                                  {message.metrics.legalReferences > 0 && (
                                    <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                                      <div className="text-xs text-muted-foreground mb-1">Referências</div>
                                      <div className="text-lg font-bold text-blue-600">{message.metrics.legalReferences}</div>
                                    </div>
                                  )}
                                  {message.metrics.practicalExamples > 0 && (
                                    <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                                      <div className="text-xs text-muted-foreground mb-1">Exemplos</div>
                                      <div className="text-lg font-bold text-green-600">{message.metrics.practicalExamples}</div>
                                    </div>
                                  )}
                                </div>
                                {message.metrics.topics.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {message.metrics.topics.map((topic, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {topic}
                                      </Badge>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             )}
                    </>
                  })() : <p className="text-[15px] leading-[1.4] whitespace-pre-wrap">{message.content}</p>}
                  
                  {/* Não mostrar cursor piscante - apenas TypingIndicator */}
                </div>
              </div>
              )}
              </div>
            ))}
            {/* Estado: Pensando (antes de começar a receber resposta) */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start mb-4 px-4">
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Scale className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-[15px] font-medium">Pensando...</span>
                </div>
              </div>
            )}
            
            {/* Removido "Gerando..." - usar apenas TypingIndicator */}
          </>}
        </ScrollArea>

        {/* Botão flutuante de nova mensagem */}
        {showNewMessageButton && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
            <Button
              onClick={scrollToBottom}
              size="sm"
              className="shadow-lg bg-primary hover:bg-primary/90 gap-2"
            >
              <ArrowDown className="w-4 h-4" />
              Nova mensagem
            </Button>
          </div>
        )}
      </div>

      {/* Footer fixo com arquivos anexados e input */}
      <div className="flex-shrink-0">
        {uploadedFiles.length > 0 && <div className="px-4 py-2 border-t border-border bg-background">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => <div key={index} className="flex items-center gap-2 bg-accent/10 rounded-lg px-3 py-2 text-sm">
                  {file.type.includes("image") ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(index)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
                </div>)}
            </div>
          </div>}

        <div className="border-t border-border bg-background px-4 py-3 space-y-3">
          {mode !== "recommendation" && (
            <div className="flex gap-2">
              <input ref={imageInputRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], "image")} className="hidden" />
              <button onClick={() => imageInputRef.current?.click()} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent/20 hover:bg-accent/30 transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed">
                <Image className="w-4 h-4" /><span className="text-sm font-medium">Analisar Imagem</span>
              </button>
              <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], "pdf")} className="hidden" />
              <button onClick={() => pdfInputRef.current?.click()} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent/20 hover:bg-accent/30 transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed">
                <FileText className="w-4 h-4" /><span className="text-sm font-medium">Analisar PDF</span>
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }} placeholder="Digite sua pergunta..." disabled={isLoading || isCreatingLesson} className="flex-1" />
            <Button onClick={sendMessage} disabled={isLoading || isCreatingLesson || !input.trim() && uploadedFiles.length === 0} size="icon">
              {isLoading || isCreatingLesson ? <Brain className="w-4 h-4 animate-pulse" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default ChatProfessora;
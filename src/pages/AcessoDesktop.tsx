import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Monitor, ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Autoplay from "embla-carousel-autoplay";
const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("E-mail inválido").max(255, "E-mail muito longo")
});
type FormData = z.infer<typeof formSchema>;
const AcessoDesktop = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [imagens, setImagens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });
  useEffect(() => {
    const carregarImagens = async () => {
      setIsLoading(true);
      try {
        const {
          data,
          error
        } = await supabase.from("IMAGEM - DESKTOP" as any).select("link").order("Imagem", {
          ascending: true
        });
        if (error) throw error;
        if (data && data.length > 0) {
          const links = data.map((item: any) => item.link).filter((link): link is string => Boolean(link));
          setImagens(links);
        }
      } catch (error) {
        console.error("Erro ao carregar imagens:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as imagens da plataforma"
        });
      } finally {
        setIsLoading(false);
      }
    };
    carregarImagens();
  }, [toast]);
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.functions.invoke("salvar-acesso-desktop", {
        body: {
          nome: data.nome,
          email: data.email
        }
      });
      if (error) throw error;
      toast({
        title: "Acesso enviado!",
        description: "Por favor, verifique seu e-mail."
      });
      reset();
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Não foi possível processar sua solicitação. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background px-3 py-4">
      <div className="max-w-4xl mx-auto">
        

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-600 shadow-lg shadow-cyan-500/50">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acesso Desktop</h1>
              <p className="text-sm text-muted-foreground">
                Acesse a plataforma completa no seu computador
              </p>
            </div>
          </div>
        </div>

        {/* Carrossel de Imagens */}
        <Card className="mb-6 border-2 border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div> : imagens.length > 0 ? <Carousel opts={{
            align: "start",
            loop: true
          }} plugins={[Autoplay({
            delay: 4000
          })]} className="w-full">
                <CarouselContent>
                  {imagens.map((imagem, index) => <CarouselItem key={index}>
                      <div className="relative h-[300px] md:h-[400px] w-full">
                        <img 
                          src={imagem} 
                          alt={`Plataforma Desktop ${index + 1}`} 
                          className="w-full h-full object-contain bg-secondary/20"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      </div>
                    </CarouselItem>)}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel> : <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma imagem disponível
              </div>}
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card className="border-2 border-border bg-card">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Solicite seu Acesso
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Preencha o formulário abaixo e receba as instruções de acesso à
              plataforma desktop no seu e-mail.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" {...register("nome")} placeholder="Digite seu nome completo" className="mt-1.5" />
                {errors.nome && <p className="text-sm text-destructive mt-1">
                    {errors.nome.message}
                  </p>}
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register("email")} placeholder="seuemail@exemplo.com" className="mt-1.5" />
                {errors.email && <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </> : "Solicitar Acesso"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
              <h3 className="font-semibold text-sm text-foreground mb-2">
                O que você terá acesso:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Interface completa e otimizada para desktop</li>
                <li>• Recursos exclusivos de produtividade</li>
                <li>• Experiência aprimorada de estudo</li>
                <li>• Suporte técnico dedicado</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AcessoDesktop;
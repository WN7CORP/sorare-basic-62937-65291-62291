import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Video, Monitor, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/VideoPlayer";
import { useDeviceType } from "@/hooks/use-device-type";

interface BibliotecaLivroTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  sobre?: string;
  beneficios?: string;
  aulaUrl?: string;
  downloadUrl?: string;
  livroTitulo: string;
}

export const BibliotecaLivroTabs = ({
  activeTab,
  onTabChange,
  sobre,
  beneficios,
  aulaUrl,
  downloadUrl,
  livroTitulo,
}: BibliotecaLivroTabsProps) => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const SobreContent = () => (
    <div className="space-y-4">
      {sobre && (
        <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
          <h2 className="text-xl font-semibold mb-4">Sobre o livro</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {sobre}
          </p>
        </div>
      )}
      {beneficios && (
        <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
          <h2 className="text-xl font-semibold mb-4">Benefícios</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {beneficios}
          </p>
        </div>
      )}
    </div>
  );

  const AulaContent = () => (
    <>
      {aulaUrl && (
        <div className="bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-accent/20">
          <div className="aspect-video">
            <VideoPlayer src={aulaUrl} autoPlay={false} />
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Videoaula sobre {livroTitulo}
            </h2>
            <p className="text-muted-foreground">
              Assista à aula completa sobre este material
            </p>
          </div>
        </div>
      )}
    </>
  );

  const DesktopContent = () => (
    <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
      <Monitor className="w-16 h-16 mx-auto mb-4 text-accent" />
      <h2 className="text-xl font-semibold mb-4">Acesso Desktop</h2>
      <p className="text-muted-foreground mb-6">
        Leia este livro diretamente no seu computador através do nosso sistema desktop
      </p>
      <Button
        onClick={() => navigate("/acesso-desktop")}
        size="lg"
        className="min-w-[200px]"
      >
        <Monitor className="w-5 h-5 mr-2" />
        Acessar Desktop
      </Button>
    </div>
  );

  const DownloadContent = () => (
    <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
      {downloadUrl ? (
        <>
          <Download className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h2 className="text-xl font-semibold mb-4">Download do Livro</h2>
          <p className="text-muted-foreground mb-6">
            Faça o download do livro para ler offline
          </p>
          <Button
            onClick={() => window.open(downloadUrl, "_blank")}
            size="lg"
            className="min-w-[200px]"
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar Agora
          </Button>
        </>
      ) : (
        <>
          <Download className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-4">Em breve</h2>
          <p className="text-muted-foreground">
            Download estará disponível em breve
          </p>
        </>
      )}
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      {isDesktop ? (
        <div className="flex gap-6">
          {/* Tabs Verticais - Desktop */}
          <TabsList className="flex flex-col h-fit gap-2 bg-transparent p-0 min-w-[180px]">
            <TabsTrigger 
              value="sobre" 
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Sobre
            </TabsTrigger>
            <TabsTrigger 
              value="aula" 
              disabled={!aulaUrl}
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Video className="w-4 h-4 mr-2" />
              Aula
            </TabsTrigger>
            <TabsTrigger 
              value="desktop"
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </TabsTrigger>
            <TabsTrigger 
              value="download" 
              disabled={!downloadUrl}
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo ao lado - Desktop */}
          <div className="flex-1">
            <TabsContent value="sobre" className="mt-0">
              <SobreContent />
            </TabsContent>

            <TabsContent value="aula" className="mt-0">
              <AulaContent />
            </TabsContent>

            <TabsContent value="desktop" className="mt-0">
              <DesktopContent />
            </TabsContent>

            <TabsContent value="download" className="mt-0">
              <DownloadContent />
            </TabsContent>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs Horizontais - Mobile/Tablet */}
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="sobre">Sobre</TabsTrigger>
            <TabsTrigger value="aula" disabled={!aulaUrl}>Aula</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
            <TabsTrigger value="download" disabled={!downloadUrl}>Download</TabsTrigger>
          </TabsList>

          <TabsContent value="sobre">
            <SobreContent />
          </TabsContent>

          <TabsContent value="aula">
            <AulaContent />
          </TabsContent>

          <TabsContent value="desktop">
            <DesktopContent />
          </TabsContent>

          <TabsContent value="download">
            <DownloadContent />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
};

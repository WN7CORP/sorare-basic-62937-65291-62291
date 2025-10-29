import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { AmbientSoundProvider } from "./contexts/AmbientSoundContext";
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";
import AmbientSoundPlayer from "./components/AmbientSoundPlayer";
import { AvaliarAppModal } from "./components/AvaliarAppModal";
import { useAppRating } from "./hooks/useAppRating";
import Index from "./pages/Index";
import Codigos from "./pages/Codigos";
import CodigoView from "./pages/CodigoView";
import VideoAula from "./pages/VideoAula";
import Cursos from "./pages/Cursos";
import CursosModulos from "./pages/CursosModulos";
import CursosAulas from "./pages/CursosAulas";
import CursoAulaView from "./pages/CursoAulaView";
import Constituicao from "./pages/Constituicao";
import Estatutos from "./pages/Estatutos";
import EstatutoView from "./pages/EstatutoView";
import Sumulas from "./pages/Sumulas";
import SumulaView from "./pages/SumulaView";
import Pesquisar from "./pages/Pesquisar";
import ChatProfessora from "./pages/ChatProfessora";
import AulaInterativa from "./pages/AulaInterativa";
import Dicionario from "./pages/Dicionario";
import Ferramentas from "./pages/Ferramentas";
import Advogado from "./pages/Advogado";
import AdvogadoModelos from "./pages/AdvogadoModelos";
import AdvogadoCriar from "./pages/AdvogadoCriar";
import Novidades from "./pages/Novidades";
import Suporte from "./pages/Suporte";
import Estagios from "./pages/Estagios";
import EstagioDetalhes from "./pages/EstagioDetalhes";
import EstagiosDicas from "./pages/EstagiosDicas";
import AssistentePessoal from "./pages/AssistentePessoal";
import NoticiaWebView from "./components/NoticiaWebView";
import NotFound from "./pages/NotFound";
import VadeMecumTodas from "./pages/VadeMecumTodas";
import VadeMecumBusca from "./pages/VadeMecumBusca";
import BibliotecaOAB from "./pages/BibliotecaOAB";
import BibliotecaOABLivro from "./pages/BibliotecaOABLivro";
import BibliotecaEstudos from "./pages/BibliotecaEstudos";
import BibliotecaEstudosLivro from "./pages/BibliotecaEstudosLivro";
import BibliotecaClassicos from "./pages/BibliotecaClassicos";
import BibliotecaClassicosLivro from "./pages/BibliotecaClassicosLivro";
import BibliotecaForaDaToga from "./pages/BibliotecaForaDaToga";
import BibliotecaForaDaTogaLivro from "./pages/BibliotecaForaDaTogaLivro";
import BibliotecaOratoria from "./pages/BibliotecaOratoria";
import BibliotecaOratoriaLivro from "./pages/BibliotecaOratoriaLivro";
import BibliotecaLideranca from "./pages/BibliotecaLideranca";
import BibliotecaLiderancaLivro from "./pages/BibliotecaLiderancaLivro";
import Bibliotecas from "./pages/Bibliotecas";
import Aprender from "./pages/Aprender";
import AcessoDesktop from "./pages/AcessoDesktop";
import EstagiosHub from "./pages/aprender/EstagiosHub";
import EstagiosBuscar from "./pages/aprender/EstagiosBuscar";
import EstagiosBlog from "./pages/aprender/EstagiosBlog";
import Analisar from "./pages/Analisar";
import AnalisarResultado from "./pages/AnalisarResultado";
import ResumosJuridicosEscolha from "./pages/ResumosJuridicosEscolha";
import ResumosPersonalizados from "./pages/ResumosPersonalizados";
import ResumosProntos from "./pages/ResumosProntos";
import ResumosProntosView from "./pages/ResumosProntosView";
import ResumosResultado from "./pages/ResumosResultado";
import PlanoEstudos from "./pages/PlanoEstudos";
import PlanoEstudosResultado from "./pages/PlanoEstudosResultado";
import FlashcardsAreas from "./pages/FlashcardsAreas";
import FlashcardsTemas from "./pages/FlashcardsTemas";
import FlashcardsEstudar from "./pages/FlashcardsEstudar";
import Simulados from "./pages/Simulados";
import SimuladosExames from "./pages/SimuladosExames";
import SimuladosPersonalizado from "./pages/SimuladosPersonalizado";
import SimuladosRealizar from "./pages/SimuladosRealizar";
import SimuladosResultado from "./pages/SimuladosResultado";
import Audioaulas from "./pages/Audioaulas";
import AudioaulasTema from "./pages/AudioaulasTema";
import JuriFlix from "./pages/JuriFlix";
import JuriFlixDetalhesEnhanced from "./pages/JuriFlixDetalhesEnhanced";
import JuriFlixEnriquecer from "./pages/JuriFlixEnriquecer";
import VideoaulasAreas from "./pages/VideoaulasAreas";
import VideoaulasOAB from "./pages/VideoaulasOAB";
import VideoaulasPlaylists from "./pages/VideoaulasPlaylists";
import VideoaulasArea from "./pages/VideoaulasArea";
import VideoaulasPlayer from "./pages/VideoaulasPlayer";
import Eleicoes from "./pages/Eleicoes";
import EleicoesSituacao from "./pages/EleicoesSituacao";
import EleicoesCandidatos from "./pages/EleicoesCandidatos";
import EleicoesResultados from "./pages/EleicoesResultados";
import EleicoesEleitorado from "./pages/EleicoesEleitorado";
import EleicoesHistorico from "./pages/EleicoesHistorico";
import EleicoesPrestacaoContas from "./pages/EleicoesPrestacaoContas";
import EleicoesLegislacao from "./pages/EleicoesLegislacao";
import EleicoesCalendario from "./pages/EleicoesCalendario";
import CamaraDeputados from "./pages/CamaraDeputados";
import CamaraDeputadosLista from "./pages/CamaraDeputadosLista";
import CamaraDeputadoDetalhes from "./pages/CamaraDeputadoDetalhes";
import CamaraProposicoes from "./pages/CamaraProposicoes";
import CamaraProposicoesLista from "./pages/CamaraProposicoesLista";
import CamaraVotacoes from "./pages/CamaraVotacoes";
import CamaraDespesas from "./pages/CamaraDespesas";
import CamaraEventos from "./pages/CamaraEventos";
import CamaraOrgaos from "./pages/CamaraOrgaos";
import CamaraFrentes from "./pages/CamaraFrentes";
import CamaraPartidos from "./pages/CamaraPartidos";
import CamaraRankings from "./pages/CamaraRankings";
import CamaraRankingDeputados from "./pages/CamaraRankingDeputados";
import CamaraBlocos from "./pages/CamaraBlocos";
import CamaraVotacaoDetalhes from "./pages/CamaraVotacaoDetalhes";
import CamaraProposicaoDetalhes from "./pages/CamaraProposicaoDetalhes";
import Jurisprudencia from "./pages/Jurisprudencia";
import JurisprudenciaResultados from "./pages/JurisprudenciaResultados";
import JurisprudenciaDetalhes from "./pages/JurisprudenciaDetalhes";
import JurisprudenciaTemas from "./pages/JurisprudenciaTemas";
import Processo from "./pages/Processo";
import NoticiasJuridicas from "./pages/NoticiasJuridicas";
import NoticiaDetalhes from "./pages/NoticiaDetalhes";
import NoticiaAnalise from "./pages/NoticiaAnalise";
import RankingFaculdades from "./pages/RankingFaculdades";
import RankingFaculdadeDetalhes from "./pages/RankingFaculdadeDetalhes";
import BuscarJurisprudencia from "./pages/BuscarJurisprudencia";
import SimulacaoEscolhaModo from "./pages/SimulacaoEscolhaModo";
import SimulacaoJuridica from "./pages/SimulacaoJuridica";
import SimulacaoAreas from "./pages/SimulacaoAreas";
import SimulacaoEscolhaEstudo from "./pages/SimulacaoEscolhaEstudo";
import SimulacaoTemas from "./pages/SimulacaoTemas";
import SimulacaoArtigos from "./pages/SimulacaoArtigos";
import SimulacaoEscolhaCaso from "./pages/SimulacaoEscolhaCaso";
import SimulacaoAudienciaNew from "./pages/SimulacaoAudienciaNew";
import SimulacaoAudienciaJuiz from "./pages/SimulacaoAudienciaJuiz";
import SimulacaoFeedback from "./pages/SimulacaoFeedback";
import SimulacaoFeedbackJuiz from "./pages/SimulacaoFeedbackJuiz";
import SimulacaoAvatar from "./pages/SimulacaoAvatar";
import SimulacaoCaso from "./pages/SimulacaoCaso";
import JogosJuridicos from "./pages/JogosJuridicos";
import JogoConfig from "./pages/JogoConfig";
import JogoRouter from "./pages/jogos/JogoRouter";
import OAB from "./pages/OAB";
import MeuBrasil from "./pages/MeuBrasil";
import MeuBrasilHistoria from "./pages/MeuBrasilHistoria";
import MeuBrasilHistoriaView from "./pages/MeuBrasilHistoriaView";
import MeuBrasilSistemas from "./pages/MeuBrasilSistemas";
import MeuBrasilJuristas from "./pages/MeuBrasilJuristas";
import MeuBrasilJuristaView from "./pages/MeuBrasilJuristaView";
import MeuBrasilInstituicoes from "./pages/MeuBrasilInstituicoes";
import MeuBrasilCasos from "./pages/MeuBrasilCasos";
import MeuBrasilArtigo from "./pages/MeuBrasilArtigo";
import MeuBrasilBusca from "./pages/MeuBrasilBusca";
import PopularMeuBrasil from "./pages/PopularMeuBrasil";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const App = () => {
  const {
    shouldShowRating,
    deviceType,
    handleRated,
    handlePostpone,
  } = useAppRating();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AudioPlayerProvider>
            <AmbientSoundProvider>
              <Layout>
                <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/vade-mecum" element={<VadeMecumTodas />} />
              <Route path="/vade-mecum/busca" element={<VadeMecumBusca />} />
              <Route path="/codigos" element={<Codigos />} />
              <Route path="/codigo/:id" element={<CodigoView />} />
              <Route path="/video-aula" element={<VideoAula />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/cursos/modulos" element={<CursosModulos />} />
              <Route path="/cursos/aulas" element={<CursosAulas />} />
              <Route path="/cursos/aula" element={<CursoAulaView />} />
              <Route path="/constituicao" element={<Constituicao />} />
              <Route path="/estatutos" element={<Estatutos />} />
              <Route path="/estatuto/:id" element={<EstatutoView />} />
              <Route path="/sumulas" element={<Sumulas />} />
              <Route path="/sumula/:id" element={<SumulaView />} />
              <Route path="/pesquisar" element={<Pesquisar />} />
              <Route path="/chat-professora" element={<ChatProfessora />} />
              <Route path="/aula-interativa" element={<AulaInterativa />} />
              <Route path="/ferramentas" element={<Ferramentas />} />
              <Route path="/dicionario" element={<Dicionario />} />
              <Route path="/bibliotecas" element={<Bibliotecas />} />
            <Route path="/biblioteca-oab" element={<BibliotecaOAB />} />
            <Route path="/biblioteca-oab/:livroId" element={<BibliotecaOABLivro />} />
            <Route path="/biblioteca-estudos" element={<BibliotecaEstudos />} />
            <Route path="/biblioteca-estudos/:livroId" element={<BibliotecaEstudosLivro />} />
            <Route path="/biblioteca-classicos" element={<BibliotecaClassicos />} />
            <Route path="/biblioteca-classicos/:livroId" element={<BibliotecaClassicosLivro />} />
            <Route path="/biblioteca-fora-da-toga" element={<BibliotecaForaDaToga />} />
            <Route path="/biblioteca-fora-da-toga/:livroId" element={<BibliotecaForaDaTogaLivro />} />
            <Route path="/biblioteca-oratoria" element={<BibliotecaOratoria />} />
            <Route path="/biblioteca-oratoria/:livroId" element={<BibliotecaOratoriaLivro />} />
            <Route path="/biblioteca-lideranca" element={<BibliotecaLideranca />} />
            <Route path="/biblioteca-lideranca/:livroId" element={<BibliotecaLiderancaLivro />} />
              <Route path="/aprender" element={<Aprender />} />
              <Route path="/aprender/estagios" element={<EstagiosHub />} />
              <Route path="/aprender/estagios/buscar" element={<EstagiosBuscar />} />
              <Route path="/aprender/estagios/blog" element={<EstagiosBlog />} />
              <Route path="/acesso-desktop" element={<AcessoDesktop />} />
              <Route path="/analisar" element={<Analisar />} />
              <Route path="/analisar/resultado" element={<AnalisarResultado />} />
              <Route path="/resumos-juridicos" element={<ResumosJuridicosEscolha />} />
              <Route path="/resumos-juridicos/prontos" element={<ResumosProntos />} />
              <Route path="/resumos-juridicos/prontos/:area/:tema" element={<ResumosProntosView />} />
              <Route path="/resumos-juridicos/personalizado" element={<ResumosPersonalizados />} />
              <Route path="/resumos-juridicos/resultado" element={<ResumosResultado />} />
              <Route path="/plano-estudos" element={<PlanoEstudos />} />
              <Route path="/plano-estudos/resultado" element={<PlanoEstudosResultado />} />
              <Route path="/flashcards" element={<FlashcardsAreas />} />
              <Route path="/flashcards/temas" element={<FlashcardsTemas />} />
              <Route path="/flashcards/estudar" element={<FlashcardsEstudar />} />
              <Route path="/oab" element={<OAB />} />
              <Route path="/videoaulas-oab" element={<VideoaulasOAB />} />
              <Route path="/simulados" element={<Simulados />} />
              <Route path="/simulados/exames" element={<SimuladosExames />} />
              <Route path="/simulados/personalizado" element={<SimuladosPersonalizado />} />
              <Route path="/simulados/realizar" element={<SimuladosRealizar />} />
              <Route path="/simulados/resultado" element={<SimuladosResultado />} />
              <Route path="/audioaulas" element={<Audioaulas />} />
              <Route path="/audioaulas/:area" element={<AudioaulasTema />} />
              <Route path="/juriflix" element={<JuriFlix />} />
              <Route path="/juriflix/:id" element={<JuriFlixDetalhesEnhanced />} />
              <Route path="/juriflix-enriquecer" element={<JuriFlixEnriquecer />} />
              <Route path="/advogado" element={<Advogado />} />
              <Route path="/advogado/modelos" element={<AdvogadoModelos />} />
              <Route path="/advogado/criar" element={<AdvogadoCriar />} />
              <Route path="/videoaulas" element={<VideoaulasAreas />} />
              <Route path="/videoaulas/area/:area" element={<VideoaulasArea />} />
              <Route path="/videoaulas/:area" element={<VideoaulasPlaylists />} />
              <Route path="/videoaulas/player" element={<VideoaulasPlayer />} />
              <Route path="/eleicoes" element={<Eleicoes />} />
              <Route path="/eleicoes/situacao" element={<EleicoesSituacao />} />
              <Route path="/eleicoes/candidatos" element={<EleicoesCandidatos />} />
              <Route path="/eleicoes/resultados" element={<EleicoesResultados />} />
              <Route path="/eleicoes/eleitorado" element={<EleicoesEleitorado />} />
              <Route path="/eleicoes/historico" element={<EleicoesHistorico />} />
              <Route path="/eleicoes/prestacao-contas" element={<EleicoesPrestacaoContas />} />
              <Route path="/eleicoes/legislacao" element={<EleicoesLegislacao />} />
              <Route path="/eleicoes/calendario" element={<EleicoesCalendario />} />
              <Route path="/camara-deputados" element={<CamaraDeputados />} />
              <Route path="/camara-deputados/deputados" element={<CamaraDeputadosLista />} />
              <Route path="/camara-deputados/deputado/:id" element={<CamaraDeputadoDetalhes />} />
              <Route path="/camara-deputados/proposicoes" element={<CamaraProposicoes />} />
              <Route path="/camara-deputados/proposicoes/:tipo" element={<CamaraProposicoesLista />} />
              <Route path="/camara-deputados/proposicao/:id" element={<CamaraProposicaoDetalhes />} />
          <Route path="/camara-deputados/votacoes" element={<CamaraVotacoes />} />
          <Route path="/camara-deputados/votacao/:id" element={<CamaraVotacaoDetalhes />} />
          <Route path="/camara-deputados/rankings" element={<CamaraRankings />} />
          <Route path="/camara-deputados/ranking/:tipo" element={<CamaraRankingDeputados />} />
          <Route path="/camara-deputados/blocos" element={<CamaraBlocos />} />
              <Route path="/camara-deputados/despesas" element={<CamaraDespesas />} />
              <Route path="/camara-deputados/eventos" element={<CamaraEventos />} />
              <Route path="/camara-deputados/orgaos" element={<CamaraOrgaos />} />
              <Route path="/camara-deputados/frentes" element={<CamaraFrentes />} />
              <Route path="/camara-deputados/partidos" element={<CamaraPartidos />} />
              <Route path="/processo" element={<Processo />} />
              <Route path="/jurisprudencia" element={<Jurisprudencia />} />
              <Route path="/jurisprudencia/resultados" element={<JurisprudenciaResultados />} />
              <Route path="/jurisprudencia/detalhes/:numeroProcesso" element={<JurisprudenciaDetalhes />} />
              <Route path="/jurisprudencia/temas" element={<JurisprudenciaTemas />} />
              <Route path="/jurisprudencia/temas/:tema" element={<JurisprudenciaResultados />} />
              <Route path="/noticias-juridicas" element={<NoticiasJuridicas />} />
              <Route path="/noticias-juridicas/:noticiaId" element={<NoticiaDetalhes />} />
              <Route path="/noticia-webview" element={<NoticiaWebView />} />
              <Route path="/noticia-analise" element={<NoticiaAnalise />} />
              <Route path="/ranking-faculdades" element={<RankingFaculdades />} />
              <Route path="/ranking-faculdades/:id" element={<RankingFaculdadeDetalhes />} />
              <Route path="/buscar-jurisprudencia" element={<BuscarJurisprudencia />} />
              <Route path="/novidades" element={<Novidades />} />
              <Route path="/suporte" element={<Suporte />} />
              <Route path="/assistente-pessoal" element={<AssistentePessoal />} />
              <Route path="/meu-brasil" element={<MeuBrasil />} />
              <Route path="/meu-brasil/historia" element={<MeuBrasilHistoria />} />
              <Route path="/meu-brasil/historia/:periodo" element={<MeuBrasilHistoriaView />} />
              <Route path="/meu-brasil/sistemas" element={<MeuBrasilSistemas />} />
              <Route path="/meu-brasil/juristas" element={<MeuBrasilJuristas />} />
              <Route path="/meu-brasil/jurista/:nome" element={<MeuBrasilJuristaView />} />
              <Route path="/meu-brasil/instituicoes" element={<MeuBrasilInstituicoes />} />
              <Route path="/meu-brasil/casos" element={<MeuBrasilCasos />} />
              <Route path="/meu-brasil/busca" element={<MeuBrasilBusca />} />
              <Route path="/meu-brasil/artigo/:titulo" element={<MeuBrasilArtigo />} />
              <Route path="/meu-brasil/sistema/:titulo" element={<MeuBrasilArtigo />} />
              <Route path="/meu-brasil/caso/:titulo" element={<MeuBrasilArtigo />} />
              <Route path="/popular-meu-brasil" element={<PopularMeuBrasil />} />
              <Route path="/simulacao-juridica" element={<SimulacaoJuridica />} />
              <Route path="/simulacao-juridica/modo" element={<SimulacaoEscolhaModo />} />
              <Route path="/simulacao-juridica/areas" element={<SimulacaoAreas />} />
              <Route path="/simulacao-juridica/escolha-estudo/:area" element={<SimulacaoEscolhaEstudo />} />
              <Route path="/simulacao-juridica/temas/:area" element={<SimulacaoTemas />} />
              <Route path="/simulacao-juridica/artigos/:area" element={<SimulacaoArtigos />} />
              <Route path="/simulacao-juridica/escolha-caso" element={<SimulacaoEscolhaCaso />} />
              <Route path="/simulacao-juridica/audiencia/:id" element={<SimulacaoAudienciaNew />} />
              <Route path="/simulacao-juridica/audiencia-juiz/:id" element={<SimulacaoAudienciaJuiz />} />
              <Route path="/simulacao-juridica/feedback/:id" element={<SimulacaoFeedback />} />
              <Route path="/simulacao-juridica/feedback-juiz/:id" element={<SimulacaoFeedbackJuiz />} />
              <Route path="/simulacao-juridica/avatar" element={<SimulacaoAvatar />} />
              <Route path="/simulacao-juridica/caso/:id" element={<SimulacaoCaso />} />
              <Route path="/jogos-juridicos" element={<JogosJuridicos />} />
              <Route path="/jogos-juridicos/:tipo/config" element={<JogoConfig />} />
              <Route path="/jogos-juridicos/:tipo/jogar" element={<JogoRouter />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
              <GlobalAudioPlayer />
              <AmbientSoundPlayer />
              <AvaliarAppModal
                open={shouldShowRating}
                onOpenChange={() => {}}
                deviceType={deviceType}
                onRated={handleRated}
                onPostpone={handlePostpone}
              />
            </Layout>
            </AmbientSoundProvider>
          </AudioPlayerProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

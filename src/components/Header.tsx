import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { VLibrasButton } from "@/components/VLibrasButton";
const getPageTitle = (pathname: string): string => {
  // Rotas específicas
  if (pathname === "/") return "";
  if (pathname === "/vade-mecum") return "Vade mecum Elite";
  if (pathname === "/constituicao") return "Constituição Federal";
  if (pathname === "/codigos") return "Códigos & Leis";
  if (pathname.startsWith("/codigo/")) return "Códigos & Leis";
  if (pathname === "/estatutos") return "Estatutos";
  if (pathname.startsWith("/estatuto/")) return "Estatutos";
  if (pathname === "/sumulas") return "Súmulas";
  if (pathname.startsWith("/sumula/")) return "Súmulas";

  // Ambiente Acadêmico
  if (pathname === "/aprender") return "Aprender";
  if (pathname === "/professora-juridica") return "Aprender";
  if (pathname === "/professora") return "Aprender";
  if (pathname === "/cursos") return "Aprender";
  if (pathname.startsWith("/cursos/")) return "Cursos";
  if (pathname === "/videoaulas") return "Aprender";
  if (pathname.startsWith("/videoaulas/")) return "Videoaulas";
  if (pathname === "/flashcards") return "Aprender";
  if (pathname.startsWith("/flashcards/")) return "Flashcards";
  if (pathname === "/resumos-juridicos") return "Aprender";
  if (pathname === "/plano-estudos") return "Aprender";

  // Bibliotecas
  if (pathname === "/bibliotecas") return "Bibliotecas";
  if (pathname.startsWith("/biblioteca-")) return "Bibliotecas";

  // Ferramentas
  if (pathname === "/ferramentas") return "Ferramentas";
  if (pathname === "/pesquisar") return "Ferramentas";
  if (pathname === "/dicionario") return "Ferramentas";

  // Simulados
  if (pathname === "/simulados") return "Simulados";
  if (pathname.startsWith("/simulados/")) return "Simulados";

  // OAB
  if (pathname === "/oab") return "OAB";
  if (pathname.startsWith("/oab/")) return "OAB";

  // Notícias Jurídicas
  if (pathname === "/noticias-juridicas") return "Notícias Jurídicas";
  if (pathname.startsWith("/noticias-juridicas/")) return "Notícias Jurídicas";
  if (pathname === "/novidades") return "Novidades";
  return "";
};
const getPreviousPageTitle = (pathname: string): string => {
  // Rotas de Leis
  if (pathname.startsWith("/codigo/")) return "Códigos & Leis";
  if (pathname.startsWith("/estatuto/")) return "Estatutos";
  if (pathname.startsWith("/sumula/")) return "Súmulas";
  if (pathname === "/codigos" || pathname === "/estatutos" || pathname === "/sumulas" || pathname === "/constituicao" || pathname === "/vade-mecum") return "Início";

  // Rotas de Aprender
  if (pathname.startsWith("/cursos/")) return "Cursos";
  if (pathname.startsWith("/videoaulas/")) return "Videoaulas";
  if (pathname.startsWith("/flashcards/")) return "Flashcards";
  if (pathname === "/cursos" || pathname === "/videoaulas" || pathname === "/flashcards" || pathname === "/resumos-juridicos" || pathname === "/plano-estudos" || pathname === "/professora-juridica") return "Aprender";
  
  // Professora com modo específico volta para Aprender
  if (pathname === "/professora" && location.search.includes("mode=")) return "Aprender";
  if (pathname === "/professora") return "Aprender";
  
  if (pathname === "/aprender") return "Início";

  // Rotas de Bibliotecas
  if (pathname.startsWith("/biblioteca-")) return "Bibliotecas";
  if (pathname === "/bibliotecas") return "Início";

  // Rotas de Ferramentas
  if (pathname === "/pesquisar" || pathname === "/dicionario" || pathname.startsWith("/advogado") || pathname.startsWith("/analisar")) return "Ferramentas";
  if (pathname === "/ferramentas") return "Início";

  // Rotas de Simulados
  if (pathname.startsWith("/simulados/")) return "Simulados";
  if (pathname === "/simulados") return "Início";

  // Rotas de OAB
  if (pathname.startsWith("/oab/")) return "OAB";
  if (pathname === "/oab") return "Início";

  // Outras rotas
  if (pathname === "/novidades") return "Início";
  if (pathname === "/noticias-juridicas") return "Início";

  // Câmara e outras seções
  if (pathname.startsWith("/camara-deputados/")) return "Câmara dos Deputados";
  if (pathname.startsWith("/noticias-juridicas/")) return "Notícias Jurídicas";
  if (pathname.startsWith("/jurisprudencia")) return "Jurisprudência";
  if (pathname.startsWith("/processo")) return "Consultar Processos";
  if (pathname.startsWith("/eleicoes")) return "Eleições";
  if (pathname.startsWith("/juriflix")) return "JuriFlix";
  if (pathname.startsWith("/ranking-faculdades")) return "Ranking de Faculdades";
  return "Início";
};
export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const pageTitle = getPageTitle(location.pathname);

  // HOME LAYOUT
  if (isHome) {
    return <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-16 md:h-14 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 md:gap-2">
            <img src="/logo.webp" alt="Direito Premium" className="w-10 h-10 md:w-8 md:h-8 rounded-lg object-cover" />
            <h1 className="md:text-lg text-foreground font-sans tracking-tight font-thin text-base">
              Direito Premium
            </h1>
          </div>
          <VLibrasButton />
        </div>
      </header>;
  }

  // INTERNAL PAGES LAYOUT
  const previousPageTitle = getPreviousPageTitle(location.pathname);
  return <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-16 md:h-14 items-center justify-between px-4 md:px-6 gap-3 max-w-7xl mx-auto">
        <button onClick={() => {
          navigate(-1);
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }} className="flex items-center gap-2 md:gap-2 px-3 md:px-3 py-2.5 md:py-2 hover:bg-secondary rounded-lg transition-all hover:scale-105 border border-border/50 hover:border-border flex-shrink-0 group" aria-label={`Voltar para ${previousPageTitle}`}>
          <ArrowLeft className="w-5 h-5 md:w-5 md:h-5 stroke-[2.5] md:stroke-[2.5] flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[10px] md:text-[9px] text-muted-foreground uppercase tracking-wide">Voltar</span>
            <span className="text-sm md:text-sm font-semibold truncate max-w-[120px] md:max-w-[200px]">{previousPageTitle}</span>
          </div>
        </button>
        <VLibrasButton />
      </div>
    </header>;
};
-- Criar tabela para cache de leis recentes
CREATE TABLE IF NOT EXISTS public.cache_leis_recentes (
  id_norma TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  numero TEXT NOT NULL,
  ano TEXT NOT NULL,
  ementa TEXT,
  titulo_gerado_ia TEXT,
  data_publicacao DATE,
  autoridade TEXT,
  codigo_relacionado TEXT,
  link_texto_integral TEXT,
  link_pdf TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leis_data ON public.cache_leis_recentes(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_leis_tipo ON public.cache_leis_recentes(tipo);
CREATE INDEX IF NOT EXISTS idx_leis_autoridade ON public.cache_leis_recentes(autoridade);
CREATE INDEX IF NOT EXISTS idx_leis_codigo ON public.cache_leis_recentes(codigo_relacionado);
CREATE INDEX IF NOT EXISTS idx_leis_updated ON public.cache_leis_recentes(updated_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.cache_leis_recentes ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública (dados são públicos)
CREATE POLICY "Permitir leitura pública de leis recentes"
  ON public.cache_leis_recentes
  FOR SELECT
  USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.cache_leis_recentes IS 'Cache de leis recentes obtidas da API LexML do Senado Federal';
COMMENT ON COLUMN public.cache_leis_recentes.id_norma IS 'Identificador único da norma (formato: tipo-numero-ano)';
COMMENT ON COLUMN public.cache_leis_recentes.titulo_gerado_ia IS 'Título atrativo gerado por IA a partir da ementa';
COMMENT ON COLUMN public.cache_leis_recentes.codigo_relacionado IS 'Código ou área jurídica relacionada identificada por IA';
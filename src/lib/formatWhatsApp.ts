/**
 * Converte Markdown para formatação do WhatsApp com emojis e estrutura melhorada
 * 
 * Formatação WhatsApp:
 * *texto* = negrito
 * _texto_ = itálico
 * ~texto~ = tachado
 * ```texto``` = monoespaçado
 */
export function formatForWhatsApp(markdown: string): string {
  let text = markdown;

  // Remover separadores horizontais e adicionar linha decorativa
  text = text.replace(/^---+$/gm, '\n━━━━━━━━━━━━━━\n');

  // Converter títulos em texto com emojis apropriados
  text = text.replace(/^#\s+(.+)$/gm, '📚 *$1*\n━━━━━━━━━━━━━━\n');
  text = text.replace(/^##\s+(.+)$/gm, '\n\n📖 *$1*\n');
  text = text.replace(/^###\s+(.+)$/gm, '\n⚖️ *$1*\n');

  // Converter negrito do markdown (** ou __) para WhatsApp (*)
  text = text.replace(/\*\*(.+?)\*\*/g, '*$1*');
  text = text.replace(/__(.+?)__/g, '*$1*');

  // Converter itálico do markdown (* ou _) para WhatsApp (_)
  // Mas primeiro precisamos proteger os negritos já convertidos
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '_$1_');
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '_$1_');

  // Converter blockquotes (>) para formato WhatsApp
  text = text.replace(/^>\s*(.+)$/gm, '💬 _"$1"_');

  // Converter code blocks
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```(\w*)\n?/g, '').replace(/```/g, '');
  });

  // Converter inline code
  text = text.replace(/`(.+?)`/g, '```$1```');

  // Converter listas não ordenadas com emojis
  text = text.replace(/^\s*[-*+]\s+(.+)$/gm, '✅ $1');

  // Converter listas ordenadas com emojis numerados
  let listCounter = 0;
  text = text.replace(/^\s*\d+\.\s+(.+)$/gm, () => {
    listCounter++;
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const emoji = listCounter <= 10 ? emojis[listCounter - 1] : '▪️';
    return `${emoji} $1`;
  });

  // Converter links para formato simples com emoji
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '🔗 $1: $2');

  // Adicionar emojis de contexto em palavras-chave comuns
  text = text.replace(/\b(importante|atenção|nota|observação)\b/gi, '⚠️ $1');
  text = text.replace(/\b(exemplo|exemplos)\b/gi, '💡 $1');
  text = text.replace(/\b(conceito|definição)\b/gi, '📝 $1');
  text = text.replace(/\b(artigo|lei|código)\b/gi, '📜 $1');
  text = text.replace(/\b(jurisprudência|decisão|sentença)\b/gi, '⚖️ $1');
  text = text.replace(/\b(doutrina|autor|entendimento)\b/gi, '👨‍⚖️ $1');

  // Adicionar espaços entre seções
  text = text.replace(/\n{3,}/g, '\n\n');

  // Limpar espaços extras
  text = text.trim();

  return text;
}

/**
 * Formata informações de um título do JuriFlix para compartilhar no WhatsApp
 */
export function formatJuriFlixForWhatsApp(titulo: {
  nome: string;
  sinopse?: string;
  beneficios?: string;
  plataforma?: string;
  link?: string;
  ano?: string | number;
  tipo?: string;
  nota?: string | number;
  onde_assistir?: any;
}): string {
  const lines: string[] = [];
  
  // Título com emoji
  lines.push(`🎬 *${titulo.nome}*`);
  lines.push('━━━━━━━━━━━━━━\n');
  
  // Info básica
  if (titulo.tipo) {
    lines.push(`📺 *Tipo:* ${titulo.tipo}`);
  }
  if (titulo.ano) {
    lines.push(`📅 *Ano:* ${titulo.ano}`);
  }
  if (titulo.nota) {
    lines.push(`⭐ *Nota:* ${titulo.nota}/10`);
  }
  lines.push('');
  
  // Sinopse
  if (titulo.sinopse) {
    lines.push(`📖 *Sinopse*`);
    lines.push(titulo.sinopse);
    lines.push('');
  }
  
  // Benefícios acadêmicos
  if (titulo.beneficios) {
    lines.push(`🎓 *Por que assistir?*`);
    lines.push(titulo.beneficios);
    lines.push('');
  }
  
  // Onde assistir
  const ondeAssistir = titulo.onde_assistir;
  if (ondeAssistir?.flatrate && ondeAssistir.flatrate.length > 0) {
    lines.push(`📺 *Disponível em:*`);
    const plataformas = ondeAssistir.flatrate.map((p: any) => p.provider_name).join(', ');
    lines.push(plataformas);
    lines.push('');
  } else if (titulo.plataforma) {
    lines.push(`📺 *Disponível em:* ${titulo.plataforma}`);
    lines.push('');
  }
  
  // Link
  if (titulo.link) {
    lines.push(`🔗 *Assistir:* ${titulo.link}`);
    lines.push('');
  }
  
  // Rodapé
  lines.push('━━━━━━━━━━━━━━');
  lines.push('_Compartilhado do JuriFlix_ ⚖️');
  
  return lines.join('\n');
}

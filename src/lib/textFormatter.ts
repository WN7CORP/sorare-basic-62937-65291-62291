// Formata texto da Constituição aplicando estilos específicos
export const formatTextWithUppercase = (text: string): string => {
  if (!text) return "";
  
  let result = text;
  
  // Aplicar negrito a parágrafos (§)
  result = result.replace(/(§\s*\d+º)/g, '<strong class="font-bold">$1</strong>');
  
  // Aplicar negrito a "Parágrafo único"
  result = result.replace(/\b(Parágrafo único\.?)\b/gi, '<strong class="font-bold">$1</strong>');
  
  // Aplicar negrito a incisos romanos (I, II, III, etc) seguidos de hífen/traço
  result = result.replace(/\b([IVXLCDM]+)\s*[-–—]\s*/g, '<strong class="font-bold">$1</strong> - ');
  
  // Aplicar negrito a alíneas (a), b), c))
  result = result.replace(/([a-z])\)/g, '<strong class="font-bold">$1)</strong>');
  
  // Identificar e marcar apenas TÍTULOS principais (linhas completas em caixa alta)
  // NÃO aplicar em textos após §, incisos, alíneas ou dentro de artigos
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // Ignora linhas vazias ou muito curtas
    if (!trimmedLine || trimmedLine.length < 3) return line;
    
    // NÃO aplicar se a linha começa com §, números romanos seguidos de -, ou alíneas
    if (/^(§|\d+º|[IVXLCDM]+\s*[-–—]|[a-z]\))/.test(trimmedLine)) {
      return line;
    }
    
    // NÃO aplicar se está dentro de um artigo (começa com "Art.")
    if (/^Art\./.test(trimmedLine)) {
      return line;
    }
    
    // Contar palavras em CAIXA ALTA
    const words = trimmedLine.split(/\s+/);
    const upperWords = words.filter(word => 
      /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\-\(\),;:\.0-9]+$/.test(word.replace(/[,;:\.\(\)]/g, ''))
    );
    
    // Se mais de 70% das palavras estão em caixa alta E tem pelo menos 2 palavras, é um título
    if (upperWords.length >= 2 && (upperWords.length / words.length) > 0.7) {
      return `<strong class="block font-bold text-accent mb-2">${line}</strong>`;
    }
    
    return line;
  });
  
  result = processedLines.join('\n');
  
  // Envolve o texto completo sem forçar tamanho de fonte (herda do container)
  return `<div class="font-normal">${result}</div>`;
};

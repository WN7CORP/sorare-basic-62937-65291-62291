interface TypingIndicatorProps {
  nome?: string;
}

export const TypingIndicator = ({ nome = "Juíza" }: TypingIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 text-purple-300 text-sm animate-fade-in">
      <div className="flex gap-1 bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0s" }} />
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
      </div>
      <span className="italic text-xs">{nome} está digitando...</span>
    </div>
  );
};

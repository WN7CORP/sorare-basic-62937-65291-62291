import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface SuggestionsPanelProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const SuggestionsPanel = ({ suggestions, onSuggestionClick }: SuggestionsPanelProps) => {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-2"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Lightbulb className="w-4 h-4" />
        <span>💡 Aprofunde seus estudos:</span>
      </div>
      
      <div className="grid gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="p-3 cursor-pointer hover:bg-accent/50 transition-all hover:shadow-md border-l-4 border-l-primary/40"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <p className="text-sm leading-relaxed">{suggestion}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

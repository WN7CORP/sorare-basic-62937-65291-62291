import { Scale, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VadeMecumTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const VadeMecumTabs = ({ activeTab, onTabChange }: VadeMecumTabsProps) => {
  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border-b border-border">
      <div className="max-w-4xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-auto bg-transparent gap-3 p-3">
            <TabsTrigger 
              value="legislacao" 
              className="flex items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg py-3 px-4 transition-colors"
            >
              <Scale className="w-4 h-4" />
              <span>Legislação</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="novas-leis" 
              className="flex items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg py-3 px-4 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Novas Leis</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

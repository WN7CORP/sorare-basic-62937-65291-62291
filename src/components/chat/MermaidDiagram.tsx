import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card } from '@/components/ui/card';

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export const MermaidDiagram = ({ chart, title }: MermaidDiagramProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (elementRef.current && chart) {
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            themeVariables: {
              primaryColor: 'hsl(var(--primary))',
              primaryTextColor: '#fff',
              primaryBorderColor: 'hsl(var(--primary))',
              lineColor: 'hsl(var(--muted-foreground))',
              secondaryColor: 'hsl(var(--secondary))',
              tertiaryColor: 'hsl(var(--accent))',
            },
            flowchart: { 
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            },
            sequence: { useMaxWidth: true },
            gantt: { useMaxWidth: true }
          });

          const { svg } = await mermaid.render(idRef.current, chart);
          if (elementRef.current) {
            elementRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Erro ao renderizar diagrama Mermaid:', error);
          if (elementRef.current) {
            elementRef.current.innerHTML = `<div class="text-destructive text-sm p-4">❌ Erro ao renderizar diagrama</div>`;
          }
        }
      }
    };

    renderDiagram();
  }, [chart]);
  
  return (
    <Card className="p-4 my-6 overflow-x-auto bg-card">
      {title && (
        <h3 className="font-semibold mb-4 text-center text-foreground">
          📊 {title}
        </h3>
      )}
      <div 
        ref={elementRef} 
        className="flex justify-center items-center min-h-[200px]"
      />
    </Card>
  );
};

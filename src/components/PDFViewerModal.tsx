import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

const PDFViewerModal = ({ isOpen, onClose, pdfUrl, title }: PDFViewerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-screen max-h-screen p-0 m-0 rounded-none border-0">
        <div className="flex flex-col h-full bg-background">
          <div className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
            <Button
              onClick={onClose}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={title}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerModal;
import { Button } from '../../../components/Button';

interface ExportActionsProps {
  onExportPdf: () => void;
  onExportDocx: () => void;
  isExporting: boolean;
  error?: string;
}

export function ExportActions({ onExportPdf, onExportDocx, isExporting, error }: ExportActionsProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onExportPdf} disabled={isExporting}>
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </Button>
        <Button variant="secondary" onClick={onExportDocx} disabled={isExporting}>
          {isExporting ? 'Exporting…' : 'Export DOCX'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

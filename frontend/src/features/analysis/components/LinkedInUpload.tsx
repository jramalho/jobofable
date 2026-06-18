import { FileUpload } from '../../../components/FileUpload';

interface LinkedInUploadProps {
  fileName: string | null;
  error?: string;
  onFileSelected: (file: File | null) => void;
}

export function LinkedInUpload({ fileName, error, onFileSelected }: LinkedInUploadProps) {
  return (
    <FileUpload
      label="LinkedIn profile export"
      hint="PDF exported from LinkedIn (Profile → More → Save to PDF)"
      accept=".pdf"
      fileName={fileName}
      error={error}
      onFileSelected={onFileSelected}
    />
  );
}

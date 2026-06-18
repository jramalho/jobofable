import { FileUpload } from '../../../components/FileUpload';

interface ResumeUploadProps {
  fileName: string | null;
  error?: string;
  onFileSelected: (file: File | null) => void;
}

export function ResumeUpload({ fileName, error, onFileSelected }: ResumeUploadProps) {
  return (
    <FileUpload
      label="Current resume"
      hint="PDF or DOCX, up to 5 MB"
      accept=".pdf,.docx"
      required
      fileName={fileName}
      error={error}
      onFileSelected={onFileSelected}
    />
  );
}

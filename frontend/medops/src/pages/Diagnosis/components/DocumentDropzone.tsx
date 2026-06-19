// src/pages/Diagnosis/components/DocumentDropzone.tsx
import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { DocumentIcon, ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  onFile: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
}

const DEFAULT_ACCEPT = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

export default function DocumentDropzone({
  onFile,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) {
        const reason = rejected[0].errors[0];
        if (reason.code === "file-too-large") {
          setError(`El archivo excede ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        } else if (reason.code === "file-invalid-type") {
          setError("Tipo de archivo no soportado");
        } else {
          setError(reason.message);
        }
        return;
      }
      if (accepted.length > 0) {
        setSelectedFile(accepted[0]);
        onFile(accepted[0]);
      }
    },
    [maxSize, onFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="relative flex items-center gap-3 p-4 bg-white/5 border border-emerald-500/20 rounded-xl">
        <DocumentIcon className="h-8 w-8 text-emerald-400 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white truncate">{selectedFile.name}</div>
          <div className="text-xs text-white/40">{formatSize(selectedFile.size)}</div>
        </div>
        <button
          onClick={clearFile}
          className="text-white/40 hover:text-white transition-colors p-1"
          title="Quitar archivo"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center
          transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-500/50 hover:bg-white/5"}
          ${isDragActive && !isDragReject ? "border-blue-500 bg-blue-500/5" : ""}
          ${isDragReject ? "border-red-500 bg-red-500/5" : "border-white/10"}
        `}
      >
        <input {...getInputProps()} />

        <ArrowUpTrayIcon className={`h-10 w-10 mx-auto mb-3 ${isDragActive ? "text-blue-400" : "text-white/30"}`} />

        {isDragReject ? (
          <div className="text-sm text-red-400">
            Tipo de archivo no soportado
          </div>
        ) : isDragActive ? (
          <div className="text-sm text-blue-400">
            Suelta el archivo aquí
          </div>
        ) : (
          <div className="text-sm text-white/50">
            <span className="text-blue-400 font-medium">Haz click o arrastra</span>{" "}
            un archivo PDF, PNG o JPG (máx. {(maxSize / 1024 / 1024).toFixed(0)}MB)
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <XMarkIcon className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}

import { FileUp, MessageSquare, FileText } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function UploadZone({ onFileSelect, isLoading = false }: UploadZoneProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full max-w-md text-center"
      >
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50">
          <FileUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Document
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your PDF or Word document here, or click to browse
          </p>
          <label className="inline-block">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleChange}
              disabled={isLoading}
              className="hidden"
            />
            <span
              className={`inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Processing...' : 'Choose File'}
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-4">
            Supports PDF and DOCX files up to 10MB
          </p>
        </div>
      </div>
    </div>
  );
}

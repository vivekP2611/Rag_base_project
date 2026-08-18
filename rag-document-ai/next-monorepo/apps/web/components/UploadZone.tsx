import { FileUp } from 'lucide-react';

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
    <div className="w-full flex items-center justify-center relative group">
      {/* Glow effect behind the drop zone */}
      <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full relative z-10"
      >
        <div className="border border-dashed border-indigo-500/30 rounded-3xl p-14 text-center cursor-pointer bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] hover:border-indigo-400/50 transition-all duration-300 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
            <FileUp className="w-10 h-10 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          </div>
          
          <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">
            Upload Document
          </h3>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">
            Drag and drop your PDF or Word document here, or click to browse your files.
          </p>
          
          <label className="inline-block relative">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleChange}
              disabled={isLoading}
              className="hidden"
            />
            <span
              className={`inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-full font-medium hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isLoading ? 'Processing...' : 'Select File'}
            </span>
          </label>
          <p className="text-xs text-indigo-300/50 mt-6 font-medium tracking-wide uppercase">
            Supports PDF and DOCX (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}

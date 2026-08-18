'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { ChatSidebar } from '@/components/ChatSidebar';
import { SummaryDisplay } from '@/components/SummaryDisplay';
import { Sparkles, FileText, RefreshCw, Layers } from 'lucide-react';

export default function Home() {
  const [sessionId, setSessionId] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<string>();
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>();
  const [chatEnabled, setChatEnabled] = useState(false);
  const [triggerQuestion, setTriggerQuestion] = useState<string>();

  const handleFileUpload = async (file: File) => {
    setUploadError(undefined);
    setIsUploading(true);
    setFileName(file.name);
    setIsLoadingSummary(false);
    setSummary(undefined);
    setKeyPoints([]);
    setSessionId(undefined);
    setChatEnabled(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const extractData = await extractRes.json();

      if (!extractRes.ok || extractData.error) {
        setUploadError(extractData.error || 'Upload failed');
        return;
      }

      const sid: string = extractData.session_id;
      const textPreview: string = extractData.text_preview || extractData.text || '';

      setSessionId(sid);
      setChatEnabled(true);

      setIsLoadingSummary(true);
      const sumRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid, text: textPreview }),
      });

      const sumData = await sumRes.json();
      if (sumRes.ok && sumData.overview) {
        setSummary(sumData.overview);
        setKeyPoints(sumData.key_points || []);
      } else {
        setSummary('Summary generation failed. Chat is still available!');
      }
    } catch (err) {
      setUploadError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
      setIsLoadingSummary(false);
    }
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    if (!sessionId) {
      return 'Please upload a document first — I can then answer any question about it!';
    }
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question: message }),
      });

      const data = await res.json();
      if (res.ok) {
        return data.answer || 'No answer received.';
      } else {
        return `⚠️ ${data.error || 'Failed to get answer.'}`;
      }
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  };

  const handleReset = () => {
    setSessionId(undefined);
    setFileName(undefined);
    setSummary(undefined);
    setKeyPoints([]);
    setChatEnabled(false);
    setUploadError(undefined);
    setIsLoadingSummary(false);
  };

  return (
    <div className="h-screen w-screen bg-[#0A0A0B] text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      {/* ── Header ── */}
      <header className="h-[76px] shrink-0 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl relative z-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">DocMind AI</h1>
              <p className="text-xs text-indigo-300/70 font-medium tracking-wide uppercase">Intelligent Document Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {sessionId && (
              <button
                onClick={handleReset}
                className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white transition-all duration-300 backdrop-blur-md"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                New Document
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main App Area (100% height minus header) ── */}
      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 z-10 relative">

        {!sessionId ? (
          <>
            {/* Left — Upload panel */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-0">
              <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <div className="min-h-full flex flex-col justify-center items-center p-8">
                    <div className="w-full max-w-xl">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-3">Analyze Any Document</h2>
                        <p className="text-gray-400 text-sm">Upload your file and let DocMind extract key insights instantly.</p>
                      </div>
                      <UploadZone onFileSelect={handleFileUpload} isLoading={isUploading} />

                      {isUploading && (
                        <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
                          <div className="flex items-center gap-4 relative z-10">
                            <div className="relative">
                              <div className="w-8 h-8 border-2 border-indigo-500/30 rounded-full" />
                              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-indigo-300">Reading Document...</p>
                              <p className="text-xs text-indigo-400/60 mt-1">Our AI is analyzing the contents to build a knowledge base.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 backdrop-blur-sm text-sm text-red-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-red-400 font-bold">!</span>
                          </div>
                          <p>{uploadError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Summary + Chat stacked (height 50% each) */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0 overflow-hidden">
              <div className="flex-[0.5] min-h-0 bg-white/[0.02] rounded-3xl shadow-2xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col relative">
                <SummaryDisplay
                  summary={summary}
                  keyPoints={keyPoints}
                  isLoading={isLoadingSummary}
                  fileName={fileName}
                />
              </div>
              <div className="flex-[0.5] min-h-0 bg-white/[0.02] rounded-3xl shadow-2xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
                <ChatSidebar
                  documentId={sessionId}
                  enabled={chatEnabled}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Column 1: Document Details & Suggested Inquiries (height 100%) */}
            <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col overflow-hidden min-h-0">
              {/* Doc info header */}
              <div className="shrink-0 border-b border-white/5 px-6 py-5 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-white text-base tracking-tight truncate max-w-[130px]">{fileName}</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Document Ready
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions / Prompt Starters */}
              <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col justify-center">
                <div className="w-full">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                      <Layers className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Knowledge Base</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Your document is fully indexable. Use our prompt starters below to chat instantly.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider mb-2 pl-1">Suggested Inquiries</p>
                    {[
                      'Give me a concise summary of this document.',
                      'What are the most important conclusions?',
                      'Can you extract all the key metrics and dates?',
                      'Explain the main topic as if I were a beginner.',
                    ].map((q, i) => (
                      <button 
                        key={i} 
                        onClick={() => setTriggerQuestion(q)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300 text-left align-middle"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-400 text-xs">✦</span>
                        </div>
                        <span className="text-gray-300 text-xs group-hover:text-white transition-colors">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: SummaryDisplay (height 100%) */}
            <div className="lg:col-span-1 bg-white/[0.02] rounded-3xl shadow-2xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col relative h-full min-h-0">
              <SummaryDisplay
                summary={summary}
                keyPoints={keyPoints}
                isLoading={isLoadingSummary}
                fileName={fileName}
              />
            </div>

            {/* Column 3: ChatSidebar (height 100%) */}
            <div className="lg:col-span-1 bg-white/[0.02] rounded-3xl shadow-2xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col relative h-full min-h-0">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
              <ChatSidebar
                documentId={sessionId}
                enabled={chatEnabled}
                onSendMessage={handleSendMessage}
                triggerQuestion={triggerQuestion}
                onClearTriggerQuestion={() => setTriggerQuestion(undefined)}
              />
            </div>
          </>
        )}
      </main>
      
      {/* Keyframe animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </div>
  );
}

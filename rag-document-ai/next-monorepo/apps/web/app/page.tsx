'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { ChatSidebar } from '@/components/ChatSidebar';
import { SummaryDisplay } from '@/components/SummaryDisplay';
import { FileText, Settings, RefreshCw } from 'lucide-react';

// ─── Text Utilities ─────────────────────────────────────────────────────────

function cleanText(raw: string): string {
  return raw
    .replace(/\(cid:\d+\)/g, ' ')     // remove PDF encoding artifacts
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or newline
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
}

// ─── Smart Extractive Summarizer ─────────────────────────────────────────────

function extractiveSummary(text: string, n = 5): string {
  const sentences = toSentences(text);
  if (sentences.length === 0) return text.slice(0, 500);
  if (sentences.length <= n) return sentences.join(' ');

  const wordFreq: Record<string, number> = {};
  sentences.forEach(s =>
    s.toLowerCase().split(/\W+/).filter(w => w.length > 4).forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    })
  );
  const maxFreq = Math.max(...Object.values(wordFreq), 1);

  const scored = sentences.map((s, idx) => {
    const words = s.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const tf = words.reduce((sum, w) => sum + (wordFreq[w] || 0) / maxFreq, 0);
    const lenBonus = Math.min(s.split(' ').length / 20, 1);
    const posBonus = idx < 5 ? 1.5 : idx < 15 ? 1.0 : 0.7;
    return { s, score: tf * posBonus + lenBonus, idx };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .sort((a, b) => a.idx - b.idx)
    .map(x => x.s)
    .join(' ');
}

function extractKeyPoints(text: string, n = 5): string[] {
  const sentences = toSentences(text);
  const scored = sentences.map(s => {
    let score = 0;
    if (/\d/.test(s)) score += 2;
    if (/•|·|–|—|\-\s/.test(s)) score += 1;
    if (/\b(built|developed|designed|created|architected|implemented|led|managed|improved|achieved|increased|reduced)\b/i.test(s)) score += 3;
    if (/\b(project|tool|skill|technology|system|platform|api|framework|database|machine learning|AI|ML|web|data|python|react|node)\b/i.test(s)) score += 2;
    if (/\b(company|role|position|experience|education|university|degree|certificate)\b/i.test(s)) score += 2;
    if (s.length < 30) score -= 1;
    if (s.length > 250) score -= 1;
    return { s, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(x => x.s.trim())
    .filter(Boolean);
}

// ─── Universal AI Chat Engine ─────────────────────────────────────────────────

export interface DocContext {
  text: string;
  sentences: string[];
  chunks: string[];
}

// Score a sentence against query terms (higher = more relevant)
function scoreSentence(sentence: string, terms: string[]): number {
  const sl = sentence.toLowerCase();
  let score = 0;
  terms.forEach(t => {
    if (sl.includes(t)) score += 2;
    // partial match bonus
    if (t.length > 4 && sl.split(/\W+/).some(w => w.startsWith(t.slice(0, 4)))) score += 0.5;
  });
  return score;
}

// Get top-N most relevant sentences for a set of query terms
function findRelevant(sentences: string[], terms: string[], topN = 6): Array<{ s: string; score: number }> {
  return sentences
    .map(s => ({ s, score: scoreSentence(s, terms) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// Detect what the user is asking for — truly open-ended
type Intent =
  | 'overview'   // what is this pdf about?
  | 'count'      // how many X?
  | 'list'       // list / which / show all
  | 'yes_no'     // does it mention / is there?
  | 'describe'   // tell me about / explain / what is?
  | 'general';   // everything else

function detectIntent(q: string): Intent {
  const lq = q.toLowerCase();
  if (/\b(what (is|are|'s) (this|the|in this) (pdf|document|file|paper)|what('s| is) in (this|the)|overview|about this|summary of|what does this|tell me (about this|what this)|explain this (pdf|doc))\b/.test(lq)) return 'overview';
  if (/\b(how many|count|number of|total (number|count)|quantity|how much|how often|how long)\b/.test(lq)) return 'count';
  if (/\b(list (all|the|every|each)|which (ones|are|were)|what (are|were) (the|all|every)|give me (a list|all|the|each)|show (me|all|every)|enumerate|all the)\b/.test(lq)) return 'list';
  if (/\b(does (it|this|the (document|pdf|paper|file))|is (there|it)|mention|include|contain|have|covered|discussed)\b/.test(lq)) return 'yes_no';
  if (/\b(tell me (more )?about|explain|describe|what (is|are|was|were)|who (is|are|was)|when|where|why|how (does|do|did|can|should|to|is|are)|define|meaning of|what does .+ mean)\b/.test(lq)) return 'describe';
  return 'general';
}

// Extract query terms from a question (remove filler words)
const STOP_WORDS = new Set([
  'what', 'is', 'are', 'was', 'were', 'the', 'this', 'that', 'these', 'those',
  'pdf', 'document', 'file', 'about', 'in', 'on', 'of', 'a', 'an', 'and', 'or',
  'for', 'to', 'with', 'from', 'it', 'its', 'does', 'do', 'did', 'have', 'has',
  'how', 'many', 'much', 'which', 'who', 'when', 'where', 'why', 'list', 'all',
  'tell', 'me', 'give', 'show', 'please', 'can', 'you', 'my', 'i', 'he', 'she',
  'they', 'we', 'there', 'be', 'been', 'being', 'some', 'any', 'other', 'more',
  'also', 'such', 'than', 'then', 'so', 'just', 'only', 'very', 'too', 'well',
  'not', 'no', 'yes', 'if', 'but', 'because', 'as', 'at', 'by', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'up', 'down',
  'mention', 'include', 'contain', 'find', 'see', 'look', 'get', 'make', 'want',
]);

function extractTerms(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// Synthesise a conversational answer from relevant sentences
function synthesise(relevant: Array<{ s: string; score: number }>, maxSentences = 3): string {
  // deduplicate very similar sentences
  const unique: string[] = [];
  relevant.forEach(({ s }) => {
    if (!unique.some(u => {
      const overlap = s.split(' ').filter(w => u.includes(w)).length;
      return overlap / s.split(' ').length > 0.7;
    })) unique.push(s);
  });
  return unique.slice(0, maxSentences).join(' ');
}

// Count ANY kind of items — numbered questions, bullet points, named items, etc.
function countMatches(text: string, terms: string[]): { count: number; items: string[] } {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

  // Detect if user is asking about numbered items (e.g. exam questions)
  const askingAboutQuestions = terms.some(t => ['question', 'questions', 'q', 'problem', 'problems', 'exercise', 'exercises', 'task', 'tasks', 'item', 'items'].includes(t));

  // 1. Count numbered lines: "1.", "Q1", "Q.1", "Question 1", "(1)", "[1]"
  const numberedRe = /^(?:Q\.?\s*\d+|Question\s+\d+|\d+[.):]|\(\d+\)|\[\d+\])/i;
  const numberedLines = lines.filter(l => numberedRe.test(l));
  if (numberedLines.length >= 2 && (askingAboutQuestions || terms.length === 0)) {
    return {
      count: numberedLines.length,
      items: numberedLines.slice(0, 15).map(l => l.slice(0, 100))
    };
  }

  // 2. Count bullet/dashed items
  const bulletLines = lines.filter(l => /^[•·\-\*>]/.test(l));
  if (bulletLines.length >= 3 && terms.length === 0) {
    return { count: bulletLines.length, items: bulletLines.slice(0, 15) };
  }

  // 3. Filter by user terms and extract proper names
  const matchedLines = terms.length > 0
    ? lines.filter(l => terms.some(t => l.toLowerCase().includes(t)))
    : lines;

  const nameRe = /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\b/g;
  const seen = new Set<string>();
  const items: string[] = [];
  const IGNORE = new Set(['The','This','These','That','With','From','Here','Your','Our','They','When','Where','How','What','Which','There','Apply','Best','View','See','Note','More','Also','Then','Than','Very','Just','Only','Such','Some','Any','All','Each']);

  matchedLines.slice(0, 30).forEach(line => {
    (line.match(nameRe) || [])
      .filter(m => !IGNORE.has(m.split(' ')[0]) && m.length > 3)
      .forEach(m => { if (!seen.has(m)) { seen.add(m); items.push(m); } });
  });

  return {
    count: items.length || matchedLines.length,
    items: items.length > 0 ? items.slice(0, 15) : matchedLines.slice(0, 10)
  };
}

// The main universal answer generator — no restrictions, any document, any question
export function generateAnswer(question: string, ctx: DocContext): string {
  const intent = detectIntent(question);
  const terms = extractTerms(question);
  const { sentences, text } = ctx;

  // ── OVERVIEW ────────────────────────────────────────────────────────────────
  if (intent === 'overview') {
    const summary = extractiveSummary(text, 4);
    return summary || 'I could not generate a summary. The document may be empty.';
  }

  // ── COUNT — works for exam questions, items, companies, anything ─────────────
  if (intent === 'count') {
    const subject = terms.join(' ') || 'items';
    const { count, items } = countMatches(text, terms);
    if (count === 0) {
      const rel = findRelevant(sentences, terms, 3);
      if (rel.length > 0) return synthesise(rel, 2);
      return `I couldn't find any "${subject}" in the document.`;
    }
    if (items.length > 0 && items[0].length > 20) {
      // items are full lines/sentences — show count + preview
      return `There are **${count}** ${subject} in this document.\n\nHere are the first few:\n\n${items.slice(0, 5).map((it, i) => `${i + 1}. ${it.slice(0, 120)}${it.length > 120 ? '…' : ''}`).join('\n')}`;
    }
    if (items.length > 0) {
      return `I found **${items.length}** ${subject}:\n\n${items.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;
    }
    return `There are approximately **${count}** matches for "${subject}" in the document.`;
  }

  // ── LIST ─────────────────────────────────────────────────────────────────────
  if (intent === 'list') {
    const rel = findRelevant(sentences, terms, 8);
    if (rel.length === 0) {
      return `I couldn't find information matching "${terms.join(' ')}" in the document.`;
    }
    const matchedLines = text.split(/\n+/).filter(l =>
      l.trim().length > 5 && (terms.length === 0 || terms.some(t => l.toLowerCase().includes(t)))
    );
    if (matchedLines.length >= 3) {
      return `Here's what I found:\n\n${matchedLines.slice(0, 8).map(l => `• ${l.trim().slice(0, 150)}`).join('\n')}`;
    }
    return synthesise(rel, 4);
  }

  // ── YES / NO ─────────────────────────────────────────────────────────────────
  if (intent === 'yes_no') {
    const rel = findRelevant(sentences, terms, 3);
    if (rel.length > 0) {
      return `Yes! Here's what I found:\n\n${synthesise(rel, 2)}`;
    }
    return `I don't see any mention of "${terms.join(' ')}" in this document.`;
  }

  // ── DESCRIBE / GENERAL — answer anything naturally ──────────────────────────
  const rel = findRelevant(sentences, terms, 6);
  if (rel.length === 0) {
    // Last resort: document overview
    const overview = extractiveSummary(text, 2);
    return `I couldn't find specific information about "${terms.join(' ')}" in this document. Here's a brief overview:\n\n${overview}`;
  }
  return synthesise(rel, 3);
}

// ─── App Component ────────────────────────────────────────────────────────────

export default function Home() {
  const [documentId, setDocumentId] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [docContext, setDocContext] = useState<DocContext | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<string>();
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>();
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [chatEnabled, setChatEnabled] = useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    setUploadError(undefined);
    setIsUploading(true);
    setFileName(file.name);
    setIsLoadingSummary(true);
    setSummary(undefined);
    setKeyPoints([]);
    setDocContext(null);
    setDocumentId(undefined);
    setChatEnabled(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const rawText =
          data.text ||
          (data.chunks || []).map((c: { text: string }) => c.text).join('\n') ||
          '';

        const text = cleanText(rawText);
        const sentences = toSentences(text);
        const chunks = (data.chunks || []).map((c: { text: string }) => cleanText(c.text));

        const ctx: DocContext = { text, sentences, chunks };
        setDocContext(ctx);
        setDocumentId(`doc_${Date.now()}`);
        setChatEnabled(true);

        setSummary(extractiveSummary(text, 5));
        setKeyPoints(extractKeyPoints(text, 5));
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
      setIsLoadingSummary(false);
    }
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    if (!docContext) {
      return 'Please upload a document first — I can then answer any question about it!';
    }
    return generateAnswer(message, docContext);
  };

  const handleReset = () => {
    setDocumentId(undefined);
    setFileName(undefined);
    setDocContext(null);
    setSummary(undefined);
    setKeyPoints([]);
    setChatEnabled(false);
    setUploadError(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DocMind AI</h1>
              <p className="text-xs text-gray-500">Intelligent Document Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {documentId && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Document
              </button>
            )}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left — Upload or Viewer */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {!documentId ? (
            <>
              <UploadZone onFileSelect={handleFileUpload} isLoading={isUploading} />
              {uploadError && (
                <div className="mx-6 mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Error:</strong> {uploadError}
                </div>
              )}
            </>
          ) : (
            <div className="h-[600px] flex flex-col">
              <div className="border-b border-gray-100 px-5 py-4 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {fileName}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {docContext?.sentences.length || 0} sentences · {docContext?.chunks.length || 0} chunks indexed
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ✓ Ready
                </span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                  <p className="font-semibold text-blue-900 mb-1">✅ Document Ready</p>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Your document is fully indexed and ready. Use the chat on the right — ask <strong>anything</strong> you want about this document, in your own words.
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-3">The assistant can answer:</p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span><span>Summaries and overviews of any document</span></div>
                    <div className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span><span>Counting items — questions in an exam, topics, sections</span></div>
                    <div className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span><span>Specific details — dates, names, values, definitions</span></div>
                    <div className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span><span>Any question you have about the content</span></div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload New Document
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — Summary + Chat */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SummaryDisplay
              summary={summary}
              keyPoints={keyPoints}
              isLoading={isLoadingSummary}
              fileName={fileName}
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[440px]">
            <ChatSidebar
              documentId={documentId}
              enabled={chatEnabled}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-400">
          © 2024 DocMind AI · Smart Extractive RAG · Works with any PDF or DOCX
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Search, AlertTriangle, Loader2, Zap, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface TermExplanation {
  summary: string;
  easyExplanation: string;
  usageContext: string;
  fieldStory: string;
  consequence: string;
}

export default function App() {
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<TermExplanation | null>(null);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!term.trim()) return;
    
    setLoading(true);
    setError('');
    setExplanation(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `다음 조선/엔진 조립 현장 용어에 대해 설명해주세요: "${term}"`,
        config: {
          systemInstruction: "당신은 조선 및 엔진 조립 현장의 베테랑 작업자이자 친절한 강사입니다. 기계 기초 지식이 있는 교육생들에게 어려운 현장 용어를 쉽고 직관적으로 설명해 주어야 합니다.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "용어에 대한 명확하고 간결한 한 줄 요약"
              },
              easyExplanation: {
                type: Type.STRING,
                description: "비유를 포함하여 초보자도 이해하기 쉬운 상세 설명"
              },
              usageContext: {
                type: Type.STRING,
                description: "이 용어나 작업이 실제 현장에서 언제, 어떻게 사용되는지 구체적인 상황"
              },
              fieldStory: {
                type: Type.STRING,
                description: "실제 작업 흐름을 이야기 형식으로 풀어낸 현장 스토리"
              },
              consequence: {
                type: Type.STRING,
                description: "이 작업을 수행하지 않거나 실수했을 때 발생하는 치명적인 문제나 결과"
              }
            },
            required: ["summary", "easyExplanation", "usageContext", "fieldStory", "consequence"]
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        const parsed = JSON.parse(resultText) as TermExplanation;
        setExplanation(parsed);
      } else {
        setError('결과를 생성하지 못했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error(err);
      setError('오류가 발생했습니다. API 키나 네트워크 상태를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-lime-400 selection:text-black pb-24">
      {/* Brutalist Header */}
      <header className="p-5 md:p-8 border-b-2 border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="font-black text-4xl md:text-5xl tracking-tighter uppercase text-lime-400 leading-none">
              Term<br />Translator
            </h1>
            <p className="font-mono text-zinc-400 mt-2 text-xs md:text-sm tracking-widest uppercase">
              // 엔진조립 AI 설명기 v1.0
            </p>
          </div>
          <Terminal className="w-8 h-8 text-zinc-700 hidden sm:block" />
        </div>
      </header>

      <main className="p-5 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Search Section */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-zinc-500 group-focus-within:text-lime-400 transition-colors" />
            </div>
            <input
              id="term-input"
              type="text"
              className="block w-full pl-14 pr-4 py-4 md:py-5 bg-zinc-900 border-2 border-zinc-800 text-lg md:text-xl font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors rounded-none"
              placeholder="현장 용어 입력..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
            />
          </div>
          
          <button
            onClick={handleTranslate}
            disabled={loading || !term.trim()}
            className="w-full flex items-center justify-center gap-3 bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-black py-4 md:py-5 font-black text-lg uppercase tracking-widest transition-all active:scale-[0.98] rounded-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 fill-current" />
                <span>Translate</span>
              </>
            )}
          </button>
          
          {/* Example terms */}
          <div className="pt-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-mono text-zinc-500 py-2 uppercase tracking-widest mr-2">Try:</span>
              {['크랭크 샤프트', '피스톤 링', '블로우바이', '태핏'].map((example) => (
                <button
                  key={example}
                  onClick={() => setTerm(example)}
                  className="text-xs md:text-sm font-mono bg-transparent border border-zinc-700 hover:border-lime-400 hover:text-lime-400 text-zinc-400 px-3 py-2 transition-colors uppercase"
                >
                  #{example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-950/50 border-2 border-red-500 text-red-400 p-4 flex items-start gap-3 font-mono text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {explanation && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 md:space-y-8 mt-8"
            >
              {/* Summary */}
              <div className="border-l-4 border-lime-400 pl-4 md:pl-6 py-2">
                <span className="text-xs font-mono text-lime-400 uppercase tracking-widest">01 // Summary</span>
                <h2 className="text-2xl md:text-4xl font-black mt-2 leading-tight text-white">
                  {explanation.summary}
                </h2>
              </div>

              {/* Easy Explanation */}
              <div className="bg-zinc-900 p-5 md:p-8 border border-zinc-800 relative group hover:border-zinc-600 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-zinc-600 transition-colors"></div>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">02 // Easy Explanation</span>
                <p className="mt-4 text-zinc-300 leading-relaxed text-base md:text-lg">
                  {explanation.easyExplanation}
                </p>
              </div>

              {/* Usage Context */}
              <div className="bg-zinc-900 p-5 md:p-8 border border-zinc-800 relative group hover:border-zinc-600 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-zinc-600 transition-colors"></div>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">03 // Usage Context</span>
                <p className="mt-4 text-zinc-300 leading-relaxed text-base md:text-lg">
                  {explanation.usageContext}
                </p>
              </div>

              {/* Field Story */}
              <div className="bg-zinc-900 p-5 md:p-8 border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700"></div>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">04 // Field Story</span>
                <p className="mt-4 text-zinc-400 leading-relaxed italic text-base md:text-lg">
                  "{explanation.fieldStory}"
                </p>
              </div>

              {/* Consequence */}
              <div className="bg-red-950/20 p-5 md:p-8 border border-red-900/50 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-900/50"></div>
                <span className="text-xs font-mono text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> 05 // Warning
                </span>
                <p className="mt-4 text-red-400 leading-relaxed font-medium text-base md:text-lg">
                  {explanation.consequence}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

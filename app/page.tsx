"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLE_IDEAS = [
  "희귀 후추를 수입해서 소분 판매하고 싶어요",
  "허브가 들어간 식용 버터 캔들 100개 만들어 팔고 싶어요",
  "수제 앞치마를 만들어서 카페에 납품하고 싶어요",
  "천연 재료로 만든 핸드크림을 판매하고 싶어요",
  "도예 원데이클래스 공방을 열고 싶어요",
];

const PAIN_POINTS = [
  {
    pain: "이 아이디어, 법적으로 괜찮을까?",
    desc: "식품인지 화학제품인지, 어떤 법이 적용되는지 검색해도 답이 안 나온다.",
  },
  {
    pain: "허가를 받으려면 어디에 뭘 내야 하지?",
    desc: "영업신고, 보건증, 위생교육... 순서도 모르고 서류도 어디서 받는지 막막하다.",
  },
  {
    pain: "재료를 어디서 사야 하고 얼마나 들지?",
    desc: "원가 계산도 안 되고, 어디서 B2B로 사야 법적으로 안전한지도 모른다.",
  },
];

const SOLUTIONS = [
  { icon: "⚖️", title: "법규 자동 스크리닝", desc: "아이디어를 입력하면 적용 법령과 금지 원료를 즉시 판별합니다." },
  { icon: "📋", title: "행정 서류 자동 생성", desc: "영업신고서·품목제조보고서 등 정부 제출용 서류를 자동으로 완성합니다." },
  { icon: "💰", title: "소싱·원가 계산", desc: "법적으로 안전한 B2B 공급처와 수량별 원가·판매가를 산출합니다." },
  { icon: "🏪", title: "채널 입점 가이드", desc: "제품에 맞는 유통 채널과 입점 조건을 한눈에 제공합니다." },
];

export default function HomePage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(
        `session_${data.sessionId}`,
        JSON.stringify({ sessionId: data.sessionId, rawText: idea, triage: data, currentStep: 1 })
      );
      router.push(`/builder/setup?session=${data.sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">오프오프 빌더</span>
          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">오프라인 전용</span>
        </div>
        <span className="text-sm text-gray-500 hidden sm:block">창업을 쉽고 탄탄하게</span>
      </header>

      {/* ① 히어로 + 입력창 통합 */}
      <section className="px-6 py-16 sm:py-24 border-b border-gray-800/50">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* 타이틀 */}
          <div className="text-center space-y-4">
            <p className="text-sm text-orange-400 font-medium tracking-widest uppercase">오프라인 창업 AI 로드맵</p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              창업을 <span className="text-orange-400">쉽고 탄탄하게</span><br />
              시작하는 방법
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              아이디어만 입력하면 법규 · 인허가 · 소싱 · 라벨 · 물류까지<br className="hidden sm:block" />
              오프오프 빌더가 처음부터 끝까지 로드맵을 만들어 드립니다.
            </p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={"예) 희귀 후추를 수입해서 소분 판매하고 싶어요\n예) 허브가 든 식용 버터 캔들 100개를 만들어 팔고 싶어요"}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-base"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !idea.trim()}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition text-lg"
            >
              {loading ? "분석 중..." : "창업 로드맵 생성하기 →"}
            </button>
          </form>

          {/* 예시 칩 */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">예시로 시작해보기</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_IDEAS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setIdea(ex)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ② 페인포인트 */}
      <section className="px-6 py-14 border-b border-gray-800/50">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-widest">이런 고민 해보셨나요?</p>
            <h2 className="text-2xl font-bold">오프라인 창업, 시작도 전에 막히는 이유</h2>
          </div>
          <div className="space-y-4">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
                <span className="text-red-400 font-bold text-lg flex-shrink-0">✗</span>
                <div>
                  <p className="font-semibold text-white">{p.pain}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ③ 해결책 */}
      <section className="px-6 py-14 border-b border-gray-800/50">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs text-orange-400 uppercase tracking-widest">오프오프 빌더의 답</p>
            <h2 className="text-2xl font-bold">아이디어만 던지세요. 나머지는 AI가 합니다.</h2>
            <p className="text-gray-400 text-sm">법규 검토 · 인허가 서류 · 소싱 · 채널까지 — 1분 안에</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOLUTIONS.map((s) => (
              <div key={s.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
                <span className="text-2xl">{s.icon}</span>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ 5단계 프로세스 */}
      <section className="border-t border-gray-800 px-6 py-10 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 text-center mb-6 uppercase tracking-widest">5단계 자동 분석 프로세스</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            {[
              { step: "01", label: "법적 타당성", desc: "규제 스크리닝" },
              { step: "02", label: "인허가·서류", desc: "행정 자동화" },
              { step: "03", label: "소싱·예산", desc: "원가 계산" },
              { step: "04", label: "안전·라벨", desc: "제품 검증" },
              { step: "05", label: "물류·채널", desc: "출시 설계" },
            ].map((s, i) => (
              <div key={s.step} className="space-y-1 relative">
                {i < 4 && <span className="hidden sm:block absolute right-0 top-3 text-gray-700 text-lg">→</span>}
                <span className="text-xs text-orange-500 font-mono font-bold">STEP {s.step}</span>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

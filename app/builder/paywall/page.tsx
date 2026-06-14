"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const PRICE = 5000;

const FREE_FEATURES = [
  { icon: "⚖️", label: "법적 타당성 분석", free: true },
  { icon: "📋", label: "인허가 체크리스트", free: true },
  { icon: "📄", label: "행정 서류 자동 생성", free: true },
];

const PAID_FEATURES = [
  { icon: "💰", label: "B2B 소싱처 + 원가·마진 계산", free: false },
  { icon: "🏷️", label: "안전 체크리스트 + 라벨 자동 작성", free: false },
  { icon: "🚚", label: "물류·채널 입점 가이드", free: false },
  { icon: "📊", label: "전체 창업 로드맵 PDF 다운로드", free: false },
];

function PaywallPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    // 이미 결제(또는 이메일 인증) 완료 시 바로 통과
    if (session.paid) {
      router.push(`/builder/sourcing?session=${sessionId}`);
      return;
    }
    setCategoryName(session.triage?.matchedCategory?.categoryName ?? "");
  }, [sessionId, router]);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function handleUnlock() {
    if (!isValidEmail(email) || !agreed) return;
    setSubmitting(true);
    setError("");
    try {
      // MVP: 이메일 저장 + 잠금 해제 (실제 결제 없이)
      // TODO: 토스페이먼츠 위젯 연동 후 실제 결제로 교체
      const stored = localStorage.getItem(`session_${sessionId}`);
      if (!stored) throw new Error("세션을 찾을 수 없습니다.");
      const session = JSON.parse(stored);
      session.paid = true;
      session.email = email;
      session.paidAt = new Date().toISOString();
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
      router.push(`/builder/sourcing?session=${sessionId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">오프오프 빌더</span>
        <div className="flex gap-2 text-xs">
          {["법규", "인허가", "소싱", "안전", "채널"].map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded ${i >= 2 ? "bg-orange-900 text-orange-300" : "bg-gray-800 text-gray-400"}`}>
              {i + 1}. {s} {i >= 2 && "🔒"}
            </span>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-16 space-y-8 w-full">

        {/* 헤더 */}
        <div className="text-center space-y-3">
          <p className="text-4xl">🔓</p>
          <h1 className="text-2xl font-bold">상세 로드맵 잠금 해제</h1>
          {categoryName && (
            <p className="text-gray-400 text-sm">
              <span className="text-white font-medium">{categoryName}</span> 창업 로드맵 3단계 상세 분석
            </p>
          )}
        </div>

        {/* 무료 vs 유료 비교 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 bg-gray-800/50">
            <p className="text-sm font-semibold text-green-400">✅ 무료 제공 (완료)</p>
          </div>
          <div className="px-5 py-3 space-y-2">
            {FREE_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3 text-sm text-gray-300">
                <span>{f.icon}</span>
                <span>{f.label}</span>
                <span className="ml-auto text-green-400 text-xs">완료</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-gray-800 bg-orange-950/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-orange-400">🔒 상세 로드맵 (잠금)</p>
              <span className="text-orange-400 font-bold">{PRICE.toLocaleString()}원 / 건</span>
            </div>
          </div>
          <div className="px-5 py-3 space-y-2">
            {PAID_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3 text-sm text-gray-400">
                <span>{f.icon}</span>
                <span>{f.label}</span>
                <span className="ml-auto text-gray-600 text-xs">잠금</span>
              </div>
            ))}
          </div>
        </div>

        {/* 이메일 입력 + 결제 폼 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="report@example.com"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
            />
            <p className="text-xs text-gray-500">결제 확인 및 로드맵 PDF 전송에 사용됩니다.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-orange-500"
            />
            <span className="text-xs text-gray-400">
              이용약관 및 개인정보 처리방침에 동의합니다. 결제 금액은 {PRICE.toLocaleString()}원이며 환불은 미사용 건에 한해 24시간 내 처리됩니다.
            </span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* MVP 안내 배너 */}
          <div className="bg-blue-950 border border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-300">
            💡 현재 베타 운영 중: 이메일 입력만으로 전체 기능을 무료로 체험할 수 있습니다. 정식 출시 후 결제가 적용됩니다.
          </div>

          <button
            onClick={handleUnlock}
            disabled={!isValidEmail(email) || !agreed || submitting}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition text-lg"
          >
            {submitting ? "처리 중..." : "상세 로드맵 잠금 해제 →"}
          </button>

          <button
            onClick={() => router.back()}
            className="w-full text-sm text-gray-500 hover:text-gray-300 py-2 transition"
          >
            ← 이전으로
          </button>
        </div>

        {/* 신뢰 배지 */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🔐", label: "안전 결제" },
            { icon: "📋", label: "법령 근거 제공" },
            { icon: "🔄", label: "24h 환불 보장" },
          ].map(b => (
            <div key={b.label} className="bg-gray-900 border border-gray-800 rounded-xl py-3 px-2 space-y-1">
              <span className="text-xl">{b.icon}</span>
              <p className="text-xs text-gray-400">{b.label}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

export default function PaywallPage() {
  return <Suspense><PaywallPageInner /></Suspense>;
}

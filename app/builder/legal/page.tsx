"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { TriageResult } from "@/types";
import { Suspense } from "react";

const STATUS_CONFIG = {
  CLEAR: { label: "✅ 합법 경로 존재", color: "text-green-400", bg: "bg-green-950 border-green-800" },
  WARNING: { label: "⚠️ 조건부 합법 — 주의 필요", color: "text-yellow-400", bg: "bg-yellow-950 border-yellow-800" },
  BLOCKED: { label: "🚫 진행 불가 — 우회안 필요", color: "text-red-400", bg: "bg-red-950 border-red-800" },
};

function LegalPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    setTriage(session.triage);
    setRawText(session.rawText);
  }, [sessionId, router]);

  if (!triage) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        분석 결과를 불러오는 중...
      </div>
    );
  }

  const status = STATUS_CONFIG[triage.legalStatus];
  const cat = triage.matchedCategory;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">오프오프 빌더</span>
        <div className="flex gap-2 text-xs text-gray-500">
          {["법적 타당성", "인허가·서류", "소싱·예산", "안전·라벨", "물류·채널"].map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded ${i === 0 ? "bg-orange-500 text-white" : "bg-gray-800"}`}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* 입력 아이디어 */}
        <div className="text-sm text-gray-400">
          입력한 아이디어: <span className="text-white">"{rawText}"</span>
        </div>

        {/* 법적 상태 배지 */}
        <div className={`border rounded-xl p-6 space-y-2 ${status.bg}`}>
          <p className={`text-xl font-bold ${status.color}`}>{status.label}</p>
          <p className="text-gray-300 text-sm">
            분류된 사업 유형:{" "}
            <span className="text-white font-semibold">{cat.categoryName}</span>
            <span className="ml-2 text-xs text-gray-500">({cat.industryGroup})</span>
          </p>
        </div>

        {/* BLOCKED 우회안 */}
        {triage.legalStatus === "BLOCKED" && triage.alternativeSuggestion && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-2">
            <p className="text-orange-400 font-semibold">💡 우회 가능한 방법</p>
            <p className="text-gray-300 text-sm">{triage.alternativeSuggestion}</p>
          </div>
        )}

        {/* 위험 원료 */}
        {triage.flaggedIngredients.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">⚠️ 주의 원료</h2>
            {triage.flaggedIngredients.map((ing, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${ing.ruleType === "PROHIBITED" ? "bg-red-900 text-red-300" : "bg-yellow-900 text-yellow-300"}`}>
                    {ing.ruleType === "PROHIBITED" ? "사용 금지" : "제한 사용"}
                  </span>
                  <span className="font-medium">{ing.ingredientName}</span>
                </div>
                {ing.restriction && <p className="text-sm text-gray-400">제한: {ing.restriction}</p>}
                {ing.legalBasis && <p className="text-xs text-gray-500">근거: {ing.legalBasis}</p>}
                {ing.safetyNote && <p className="text-xs text-orange-400">⚠ {ing.safetyNote}</p>}
              </div>
            ))}
          </div>
        )}

        {/* 적용 법령 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">📋 적용 법령</h2>
          <div className="flex flex-wrap gap-2">
            {cat.governingLaw.map((law) => (
              <span key={law} className="text-sm bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full">{law}</span>
            ))}
          </div>
        </div>

        {/* 필수 인허가 미리보기 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">🔑 필요한 인허가 ({cat.requiredLicenses.length}개)</h2>
          <div className="space-y-2">
            {cat.requiredLicenses.map((lic) => (
              <div key={lic.licenseId} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${lic.isMandatory ? "bg-red-400" : "bg-gray-500"}`} />
                  <span className="text-sm">{lic.licenseName}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">약 {lic.estimatedDays}일</span>
                  {lic.isMandatory && <span className="text-xs text-red-400">필수</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 필요 인프라 */}
        {cat.requiredInfrastructure.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">🏭 필요 인프라</h2>
            {cat.requiredInfrastructure.map((infra, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">{infra.infraType}</span>
                  {infra.isMandatory && <span className="text-xs text-red-400">필수</span>}
                </div>
                <p className="text-sm text-gray-300">{infra.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* notes */}
        {cat.notes && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
            <p className="text-blue-300 text-sm">📌 {cat.notes}</p>
          </div>
        )}

        {/* 다음 단계 */}
        <div className="pt-4">
          {triage.legalStatus !== "BLOCKED" ? (
            <button
              onClick={() => router.push(`/builder/licensing?session=${sessionId}`)}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-4 rounded-xl transition text-lg"
            >
              STEP 2: 인허가 서류 자동 생성 →
            </button>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition text-lg"
            >
              ← 아이디어 다시 입력하기
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LegalPage() {
  return (
    <Suspense>
      <LegalPageInner />
    </Suspense>
  );
}

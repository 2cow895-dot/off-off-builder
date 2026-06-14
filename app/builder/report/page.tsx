"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { TriageResult, BudgetResult } from "@/types";

interface SessionData {
  sessionId: string;
  rawText: string;
  triage: TriageResult;
  budget?: BudgetResult;
  labelFields?: Record<string, string>;
  currentStep: number;
}

const STATUS_LABEL: Record<string, string> = {
  CLEAR: "✅ 합법",
  WARNING: "⚠️ 조건부 합법",
  BLOCKED: "🚫 불가",
};

function ReportPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [session, setSession] = useState<SessionData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    const s = JSON.parse(stored);
    if (!s.paid) { router.push(`/builder/paywall?session=${sessionId}`); return; }
    setSession(s);
  }, [sessionId, router]);

  if (!session) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">불러오는 중...</div>;

  const { triage, budget, labelFields } = session;
  const cat = triage.matchedCategory;

  async function downloadPDF() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      function addText(text: string, size: number, bold = false, color: [number, number, number] = [0, 0, 0]) {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        if (bold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        doc.text(text, 15, y);
        y += size * 0.5 + 3;
        if (y > 270) { doc.addPage(); y = 20; }
      }

      function addLine() {
        doc.setDrawColor(200, 200, 200);
        doc.line(15, y, pageW - 15, y);
        y += 5;
      }

      // 헤더
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageW, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Off-Off Builder", 15, 10);
      doc.setFont("helvetica", "normal");
      doc.text("Offline Business Launch Roadmap", pageW - 15, 10, { align: "right" });

      y = 25;
      addText("OFFLINE LAUNCH ROADMAP", 18, true, [30, 30, 30]);
      addText(`Date: ${new Date().toLocaleDateString("ko-KR")}`, 9, false, [120, 120, 120]);
      addText(`Session: ${sessionId?.slice(0, 8)}`, 9, false, [120, 120, 120]);
      y += 3;
      addLine();

      // 아이디어
      addText("[Idea]", 11, true, [249, 115, 22]);
      const ideaLines = doc.splitTextToSize(session?.rawText ?? "", pageW - 30);
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      ideaLines.forEach((line: string) => {
        doc.text(line, 15, y);
        y += 6;
      });
      y += 3;

      // Step 1
      addLine();
      addText("STEP 1. Legal Triage", 13, true, [30, 30, 30]);
      addText(`Status: ${STATUS_LABEL[triage.legalStatus]}`, 10, false, [60, 60, 60]);
      addText(`Category: ${cat.categoryName} (${cat.industryGroup})`, 10, false, [60, 60, 60]);
      addText(`Laws: ${cat.governingLaw.join(" / ")}`, 9, false, [100, 100, 100]);
      if (triage.flaggedIngredients.length > 0) {
        y += 2;
        addText("Flagged Ingredients:", 9, true, [200, 50, 50]);
        triage.flaggedIngredients.forEach(f => {
          addText(`  - ${f.ingredientName} [${f.ruleType}]`, 9, false, [150, 50, 50]);
        });
      }

      // Step 2
      y += 3;
      addLine();
      addText("STEP 2. Required Licenses", 13, true, [30, 30, 30]);
      cat.requiredLicenses.filter(l => l.isMandatory).forEach(lic => {
        addText(`  [MANDATORY] ${lic.licenseName}`, 9, false, [60, 60, 60]);
        addText(`    Authority: ${lic.issuingAuthority} | Est. ${lic.estimatedDays} days`, 8, false, [120, 120, 120]);
      });

      // Step 3 (예산)
      if (budget) {
        y += 3;
        addLine();
        addText("STEP 3. Budget Estimate", 13, true, [30, 30, 30]);
        addText(`Quantity: ${budget.quantity.toLocaleString()} units`, 9, false, [60, 60, 60]);
        addText(`Fixed Cost: ${budget.fixedCost.toLocaleString()} KRW`, 9, false, [60, 60, 60]);
        addText(`Variable Cost: ${(budget.variableCostPerUnit * budget.quantity).toLocaleString()} KRW`, 9, false, [60, 60, 60]);
        addText(`Total: ${budget.totalCost.toLocaleString()} KRW`, 10, true, [30, 30, 30]);
        addText(`Recommended Retail Price: ${budget.recommendedRetailPrice.toLocaleString()} KRW`, 10, true, [249, 115, 22]);
      }

      // Step 4 (라벨)
      if (labelFields && Object.keys(labelFields).some(k => labelFields[k])) {
        y += 3;
        addLine();
        addText("STEP 4. Label Draft", 13, true, [30, 30, 30]);
        Object.entries(labelFields).forEach(([field, value]) => {
          if (value) addText(`  ${field}: ${value}`, 9, false, [60, 60, 60]);
        });
      }

      // 필수 인프라
      if (cat.requiredInfrastructure.length > 0) {
        y += 3;
        addLine();
        addText("STEP 5. Required Infrastructure", 13, true, [30, 30, 30]);
        cat.requiredInfrastructure.forEach(infra => {
          addText(`  [${infra.infraType}] ${infra.description}`, 8, false, [80, 80, 80]);
        });
      }

      // 푸터
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(`Off-Off Builder — Offline Business AI | Page ${i}/${totalPages}`, pageW / 2, 290, { align: "center" });
      }

      doc.save(`off-off-builder-roadmap-${sessionId?.slice(0, 8)}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">오프오프 빌더</span>
        <span className="text-sm text-green-400 font-medium">✅ 로드맵 완성</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* 완료 배너 */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 text-center space-y-2">
          <p className="text-4xl">🎉</p>
          <h1 className="text-2xl font-bold">오프라인 창업 로드맵 완성!</h1>
          <p className="text-orange-100 text-sm">"{session.rawText}"</p>
        </div>

        {/* Step 요약 카드 */}
        <div className="space-y-4">
          {/* Step 1 */}
          <SummaryCard step="01" title="법적 타당성" status={triage.legalStatus !== "BLOCKED" ? "pass" : "fail"}>
            <p className="text-sm text-gray-300">{cat.categoryName} — {STATUS_LABEL[triage.legalStatus]}</p>
            <p className="text-xs text-gray-500">{cat.governingLaw.join(", ")}</p>
          </SummaryCard>

          {/* Step 2 */}
          <SummaryCard step="02" title="인허가 & 서류" status="pass">
            <p className="text-sm text-gray-300">필수 인허가 {cat.requiredLicenses.filter(l => l.isMandatory).length}개</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {cat.requiredLicenses.filter(l => l.isMandatory).map(l => (
                <span key={l.licenseId} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{l.licenseName}</span>
              ))}
            </div>
          </SummaryCard>

          {/* Step 3 */}
          {budget && (
            <SummaryCard step="03" title="소싱 & 예산" status="pass">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xs text-gray-500">총 투자 비용</p><p className="font-bold text-orange-400">{budget.totalCost.toLocaleString()}원</p></div>
                <div><p className="text-xs text-gray-500">생산 수량</p><p className="font-bold">{budget.quantity}개</p></div>
                <div><p className="text-xs text-gray-500">권장 소비자가</p><p className="font-bold text-green-400">{budget.recommendedRetailPrice.toLocaleString()}원</p></div>
              </div>
            </SummaryCard>
          )}

          {/* Step 4 */}
          <SummaryCard step="04" title="안전 & 라벨" status="pass">
            {cat.mandatoryLabelFields.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {cat.mandatoryLabelFields.map(f => (
                  <span key={f} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{f}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">별도 라벨 의무 없음</p>
            )}
          </SummaryCard>

          {/* Step 5 */}
          <SummaryCard step="05" title="물류 & 채널" status="pass">
            <div className="flex flex-wrap gap-1">
              {cat.requiredInfrastructure.map((infra, i) => (
                <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{infra.infraType}</span>
              ))}
            </div>
          </SummaryCard>
        </div>

        {/* 다운로드 버튼 */}
        <div className="space-y-3 pt-4">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 text-white font-semibold py-4 rounded-xl transition text-lg flex items-center justify-center gap-2"
          >
            {downloading ? "PDF 생성 중..." : "📄 전체 로드맵 PDF 다운로드"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition"
          >
            ← 새 아이디어 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ step, title, status, children }: { step: string; title: string; status: "pass" | "fail"; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-5 space-y-3 ${status === "pass" ? "border-gray-800 bg-gray-900" : "border-red-900 bg-red-950"}`}>
      <div className="flex items-center gap-3">
        <span className="text-xs text-orange-500 font-mono font-bold">STEP {step}</span>
        <span className="font-semibold">{title}</span>
        <span className="ml-auto">{status === "pass" ? "✅" : "❌"}</span>
      </div>
      {children}
    </div>
  );
}

export default function ReportPage() {
  return <Suspense><ReportPageInner /></Suspense>;
}

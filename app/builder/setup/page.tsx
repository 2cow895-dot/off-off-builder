"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { BusinessInfo, BusinessType, SalesChannel } from "@/types";

const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

function SetupPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");

  const [hasBusinessName, setHasBusinessName] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [needsTrademark, setNeedsTrademark] = useState<boolean | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType>("undecided");
  const [region, setRegion] = useState("");
  const [salesChannel, setSalesChannel] = useState<SalesChannel>("undecided");
  const [hasPhysicalStore, setHasPhysicalStore] = useState<boolean | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    setRawText(JSON.parse(stored).rawText);
  }, [sessionId, router]);

  const canProceed =
    hasBusinessName !== null &&
    (hasBusinessName === false || businessName.trim().length > 0) &&
    region !== "" &&
    hasPhysicalStore !== null;

  function handleNext() {
    if (!canProceed) return;
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) return;
    const session = JSON.parse(stored);

    const info: BusinessInfo = {
      hasBusinessName: hasBusinessName!,
      businessName: hasBusinessName ? businessName.trim() : undefined,
      needsTrademark: hasBusinessName ? needsTrademark ?? false : undefined,
      businessType,
      region,
      salesChannel,
      hasPhysicalStore: hasPhysicalStore!,
      quantity,
    };

    session.businessInfo = info;
    session.currentStep = 1;
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    router.push(`/builder/legal?session=${sessionId}`);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">오프오프 빌더</span>
        <div className="flex gap-2 text-xs">
          <span className="bg-orange-500 text-white px-2 py-1 rounded">0. 사업 정보</span>
          {["1. 법규", "2. 인허가", "3. 소싱", "4. 안전", "5. 채널"].map(s => (
            <span key={s} className="bg-gray-800 text-gray-500 px-2 py-1 rounded hidden sm:block">{s}</span>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        {/* 아이디어 확인 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">입력한 아이디어</p>
          <p className="text-white">"{rawText}"</p>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">사업 기본 정보</h1>
          <p className="text-gray-400 text-sm">입력하신 정보는 인허가 서류 자동 완성에 사용됩니다.</p>
        </div>

        {/* 상호명 여부 */}
        <Section title="상호명이 있으신가요?" required>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceCard
              label="네, 이미 정했어요"
              selected={hasBusinessName === true}
              onClick={() => setHasBusinessName(true)}
            />
            <ChoiceCard
              label="아직 없어요"
              desc="나중에 정해도 됩니다"
              selected={hasBusinessName === false}
              onClick={() => setHasBusinessName(false)}
            />
          </div>

          {hasBusinessName === true && (
            <div className="space-y-3 mt-4">
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="예) 오프오프 스튜디오"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
              />
              <p className="text-xs text-gray-500">
                💡 상호 중복 확인 →{" "}
                <a href="https://www.iros.go.kr" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
                  인터넷 등기소
                </a>
              </p>

              {/* 상표 등록 */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">상표 등록을 원하시나요?</p>
                <p className="text-xs text-gray-500">상표 등록 없이 영업하다 분쟁이 생기면 상호명을 바꿔야 할 수 있습니다.</p>
                <div className="grid grid-cols-2 gap-2">
                  <ChoiceCard label="네, 등록할게요" selected={needsTrademark === true} onClick={() => setNeedsTrademark(true)} small />
                  <ChoiceCard label="나중에 생각할게요" selected={needsTrademark === false} onClick={() => setNeedsTrademark(false)} small />
                </div>
                {needsTrademark === true && (
                  <p className="text-xs text-orange-400">
                    특허청 상표출원 비용: 약 62,000원~/건 →{" "}
                    <a href="https://www.kipris.or.kr" target="_blank" rel="noopener noreferrer" className="underline">
                      키프리스 상표 검색
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {hasBusinessName === false && (
            <p className="text-xs text-gray-500 mt-3">
              상호명 없이도 분석을 진행할 수 있습니다. 서류 생성 시 빈칸으로 남겨드립니다.
            </p>
          )}
        </Section>

        {/* 사업자 형태 */}
        <Section title="어떤 형태로 창업하실 예정인가요?">
          <div className="grid grid-cols-3 gap-3">
            <ChoiceCard label="개인사업자" desc="빠르고 간단" selected={businessType === "sole"} onClick={() => setBusinessType("sole")} />
            <ChoiceCard label="법인" desc="투자·규모 확장" selected={businessType === "corporation"} onClick={() => setBusinessType("corporation")} />
            <ChoiceCard label="아직 미정" selected={businessType === "undecided"} onClick={() => setBusinessType("undecided")} />
          </div>
          {businessType === "sole" && (
            <p className="text-xs text-gray-500 mt-2">개인사업자 등록: 관할 세무서 또는 홈택스에서 무료 처리 가능</p>
          )}
          {businessType === "corporation" && (
            <p className="text-xs text-gray-500 mt-2">법인 설립: 법원 등기소 등록 + 설립 비용 약 50~200만원 (자본금 규모에 따라)</p>
          )}
        </Section>

        {/* 사업 예정 지역 */}
        <Section title="사업 예정 지역" required>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`py-2 rounded-lg text-sm font-medium transition border ${
                  region === r
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </Section>

        {/* 판매 방식 */}
        <Section title="주로 어떤 방식으로 판매할 예정인가요?">
          <div className="grid grid-cols-2 gap-3">
            <ChoiceCard label="오프라인만" desc="매장·팝업·마켓" selected={salesChannel === "offline_only"} onClick={() => setSalesChannel("offline_only")} />
            <ChoiceCard label="온라인만" desc="스마트스토어·쿠팡" selected={salesChannel === "online_only"} onClick={() => setSalesChannel("online_only")} />
            <ChoiceCard label="둘 다" desc="온·오프라인 병행" selected={salesChannel === "both"} onClick={() => setSalesChannel("both")} />
            <ChoiceCard label="아직 미정" selected={salesChannel === "undecided"} onClick={() => setSalesChannel("undecided")} />
          </div>
          {(salesChannel === "online_only" || salesChannel === "both") && (
            <div className="mt-3 bg-blue-950 border border-blue-800 rounded-lg px-4 py-3 text-xs text-blue-300">
              💡 온라인 판매 시 <strong>통신판매업 신고</strong>가 추가로 필요합니다. (공정거래위원회, 무료)
            </div>
          )}
        </Section>

        {/* 오프라인 매장 여부 */}
        <Section title="오프라인 매장(공간)을 열 예정인가요?" required>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceCard label="네, 매장을 열 거예요" desc="카페·공방·팝업스토어 등" selected={hasPhysicalStore === true} onClick={() => setHasPhysicalStore(true)} />
            <ChoiceCard label="아니요, 제조·유통만" desc="온라인 판매 또는 납품" selected={hasPhysicalStore === false} onClick={() => setHasPhysicalStore(false)} />
          </div>
          {hasPhysicalStore === true && (
            <div className="mt-3 bg-yellow-950 border border-yellow-800 rounded-lg px-4 py-3 text-xs text-yellow-300">
              💡 오프라인 매장 운영 시 <strong>소방 완비증명서</strong>와 <strong>건축물 용도 확인</strong>이 추가로 필요할 수 있습니다.
            </div>
          )}
        </Section>

        {/* 목표 수량 */}
        <Section title="초기 목표 생산(판매) 수량">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">수량</span>
              <span className="text-orange-400 font-bold">{quantity.toLocaleString()}개</span>
            </div>
            <input
              type="range" min={10} max={1000} step={10}
              value={quantity} onChange={e => setQuantity(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-500"><span>10개 (소량 테스트)</span><span>1,000개 (초기 양산)</span></div>
          </div>
        </Section>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition text-lg"
        >
          {canProceed ? "STEP 1: 법적 타당성 분석 →" : "필수 항목을 입력해 주세요"}
        </button>

      </div>
    </main>
  );
}

function Section({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {required && <span className="text-red-400 text-xs">필수</span>}
      </div>
      {children}
    </div>
  );
}

function ChoiceCard({ label, desc, selected, onClick, small }: {
  label: string; desc?: string; selected: boolean; onClick: () => void; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border text-left transition ${small ? "px-3 py-2" : "px-4 py-3"} ${
        selected
          ? "border-orange-500 bg-orange-950 text-white"
          : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
      }`}
    >
      <p className={`font-medium ${small ? "text-xs" : "text-sm"}`}>{label}</p>
      {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
    </button>
  );
}

export default function SetupPage() {
  return <Suspense><SetupPageInner /></Suspense>;
}

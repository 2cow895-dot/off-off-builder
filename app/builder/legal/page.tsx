"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { TriageResult, LicenseItem, IngredientRule, InfraRequirement } from "@/types";
import { Suspense } from "react";

const STATUS_CONFIG = {
  CLEAR: { label: "✅ 합법 경로 존재", color: "text-green-400", bg: "bg-green-950 border-green-800" },
  WARNING: { label: "⚠️ 조건부 합법 — 주의 필요", color: "text-yellow-400", bg: "bg-yellow-950 border-yellow-800" },
  BLOCKED: { label: "🚫 진행 불가 — 우회안 필요", color: "text-red-400", bg: "bg-red-950 border-red-800" },
};

const LAW_DESCRIPTIONS: Record<string, { summary: string; keyPoints: string[]; link?: string }> = {
  "식품위생법": {
    summary: "식품의 제조·가공·판매 등에 관한 위생 기준을 규정하는 법률입니다.",
    keyPoints: ["영업 허가 및 신고 의무", "식품위생교육 이수 의무 (신규 6시간)", "작업장 위생 기준 준수", "보건증(건강진단결과서) 발급 필요"],
    link: "https://www.law.go.kr/법령/식품위생법",
  },
  "식품등의 표시·광고에 관한 법률": {
    summary: "식품 포장지에 의무적으로 표시해야 하는 사항을 규정합니다.",
    keyPoints: ["제품명·내용량·유통기한 필수 표시", "원재료명 및 함량 표시", "알레르기 유발 원재료 별도 표시", "허위·과대 광고 금지"],
    link: "https://www.law.go.kr/법령/식품등의표시·광고에관한법률",
  },
  "화장품법": {
    summary: "화장품의 제조·수입·판매에 관한 안전 기준을 규정합니다.",
    keyPoints: ["화장품 제조업 등록 (식약처)", "책임판매업 등록 필요", "사용 금지 원료 준수 (별표 1)", "전성분 표시 의무"],
    link: "https://www.law.go.kr/법령/화장품법",
  },
  "화학물질의 등록 및 평가 등에 관한 법률(화평법)": {
    summary: "화학물질(캔들·방향제 등)의 안전성 등록 및 평가를 규정합니다.",
    keyPoints: ["연간 1톤 이상 제조·수입 시 등록 의무", "GHS 라벨링(경고 표시) 부착", "MSDS(물질안전보건자료) 작성 보관", "신규 화학물질 사전 신고"],
    link: "https://www.law.go.kr/법령/화학물질의등록및평가등에관한법률",
  },
  "제품안전기본법": {
    summary: "소비자 안전을 위한 제품의 기본 안전 기준을 규정합니다.",
    keyPoints: ["KC 안전 인증 또는 안전확인 대상 확인", "위해 제품 리콜 의무", "안전기준 적합 확인서 보관"],
    link: "https://www.law.go.kr/법령/제품안전기본법",
  },
  "전기용품 및 생활용품 안전관리법": {
    summary: "전기용품과 생활용품의 안전관리 체계를 규정합니다.",
    keyPoints: ["안전인증(KC) 대상 제품 확인", "안전확인 신고 대상 여부 확인", "공급자 적합성 확인 대상 여부 확인"],
  },
  "수입식품안전관리 특별법": {
    summary: "해외에서 수입되는 식품의 안전 관리를 위한 특별법입니다.",
    keyPoints: ["수입 전 식약처 수입신고 필수", "수입판매업 신고 필요", "현지 실사 또는 서류 심사", "부적합 제품 반송·폐기"],
    link: "https://impfood.mfds.go.kr",
  },
  "대외무역법": {
    summary: "수출입 거래의 질서 및 관리를 규정하는 법률입니다.",
    keyPoints: ["원산지 표시 의무 (수입 완제품)", "수출입 요건 확인 (해당 품목)", "HS코드 기준 관세율 적용"],
  },
};

const INFRA_DESCRIPTIONS: Record<string, { title: string; detail: string; howTo: string[]; estimatedCost: string; links?: { label: string; url: string }[] }> = {
  SHARED_KITCHEN: {
    title: "식품제조 전용 공유주방",
    detail: "식품위생법상 식품제조 영업 허가를 받은 공유주방입니다. 가정 내 주방은 영업 주소지로 사용 불가하므로, 공유주방 주소로 영업 신고를 해야 합니다.",
    howTo: ["'공유주방' 키워드로 지역별 검색", "나누다키친·위쿡·더키친 등 전문 플랫폼 활용", "시간당 또는 월정액 계약", "해당 주방의 영업 시설 기준 적합 여부 확인"],
    estimatedCost: "시간당 1~3만원 / 월정액 30~80만원",
    links: [{ label: "위쿡", url: "https://wecook.co.kr" }, { label: "나누다키친", url: "https://www.nanudakitchen.com" }],
  },
  CERTIFIED_FACILITY: {
    title: "인증된 제조 시설",
    detail: "화장품·의약외품 등은 식약처 기준의 제조 시설을 갖추거나 GMP 인증 시설에서 제조해야 합니다.",
    howTo: ["직접 시설 구축: 식약처 시설 기준 검토 후 인테리어", "임차: 기존 GMP 인증 공장에 위탁 제조 (OEM) 방식"],
    estimatedCost: "직접 구축 500만원~ / OEM 계약 별도",
    links: [{ label: "식약처 제조업 등록", url: "https://www.mfds.go.kr" }],
  },
  HOME_KITCHEN: {
    title: "가정 주방",
    detail: "식품 제조업 영업신고 주소지로 가정 주방은 원칙적으로 사용 불가합니다. 단, 즉석판매제조가공업(직접 판매 조건)은 일부 허용됩니다.",
    howTo: ["즉석판매제조가공업 신고 시 일부 가능 (조건 확인 필수)", "그 외: 공유주방 또는 별도 제조 시설 필요"],
    estimatedCost: "해당 없음",
  },
  COLD_CHAIN: {
    title: "냉장·냉동 유통 시스템",
    detail: "버터·유제품·육류·신선식품 등 온도에 민감한 제품은 생산부터 소비자까지 냉장(0~5°C) 또는 냉동(-18°C) 유통 체계가 필요합니다.",
    howTo: ["냉장 배송: CJ대한통운·한진·롯데 냉장 특송 서비스 이용", "아이스팩+보냉백: 단거리 당일 배송 시 사용", "냉동 창고: 소규모는 공유 냉동창고 활용"],
    estimatedCost: "냉장 배송 건당 4,000~8,000원 추가",
    links: [{ label: "CJ대한통운 냉장특송", url: "https://www.cjlogistics.com" }],
  },
  POPUP_STORE: {
    title: "팝업스토어 / 임시 판매 공간",
    detail: "단기 오프라인 판매를 위한 팝업 공간입니다. 5일 이하 식품 판매 시 임시영업신고로 운영 가능합니다.",
    howTo: ["스페이스클라우드·팝플리에서 공간 검색·예약", "백화점·쇼핑몰 MD팀에 팝업 제안서 발송", "임시영업신고: 영업 예정일 3일 전 관할 구청 제출"],
    estimatedCost: "하루 10만~100만원 (장소·위치 따라 상이)",
    links: [{ label: "스페이스클라우드", url: "https://www.spacecloud.kr" }, { label: "팝플리", url: "https://www.popply.co.kr" }],
  },
  WAREHOUSE: {
    title: "창고 / 보관 시설",
    detail: "완제품 또는 원재료 보관을 위한 시설입니다. 식품은 식품창고업 신고 대상일 수 있습니다.",
    howTo: ["소규모: 자택 또는 셀프스토리지 활용", "식품 보관: 식품창고업 신고 요건 확인", "물류창고: 풀필먼트 서비스 활용 (CJ·쿠팡 로켓그로스 등)"],
    estimatedCost: "셀프스토리지 월 5~20만원 / 풀필먼트 별도",
  },
  STUDIO: {
    title: "스튜디오 / 작업 공간",
    detail: "원데이클래스, 공방, 사진 촬영 등을 위한 전용 작업 공간입니다.",
    howTo: ["공방 임대: 상가 또는 공유 공방 플랫폼 활용", "소방 완비증명서 요건 확인 (다중이용업소 해당 시)", "시설 배상책임보험 가입 권장"],
    estimatedCost: "월 30~150만원 (지역·면적 따라 상이)",
  },
};

type ModalContent =
  | { type: "license"; data: LicenseItem }
  | { type: "ingredient"; data: IngredientRule }
  | { type: "infra"; data: InfraRequirement }
  | { type: "law"; data: string };

function Modal({ content, onClose }: { content: ModalContent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">✕</button>

        {content.type === "license" && <LicenseModal lic={content.data} />}
        {content.type === "ingredient" && <IngredientModal ing={content.data} />}
        {content.type === "infra" && <InfraModal infra={content.data} />}
        {content.type === "law" && <LawModal law={content.data} />}
      </div>
    </div>
  );
}

function LicenseModal({ lic }: { lic: LicenseItem }) {
  return (
    <div className="p-6 space-y-5">
      <div className="space-y-1 pr-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${lic.isMandatory ? "bg-red-900 text-red-300" : "bg-gray-700 text-gray-300"}`}>
            {lic.isMandatory ? "필수" : "선택"}
          </span>
          <h2 className="text-lg font-bold">{lic.licenseName}</h2>
        </div>
        <p className="text-sm text-gray-400">발급기관: {lic.issuingAuthority}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">예상 소요 기간</p>
          <p className="text-xl font-bold text-orange-400">{lic.estimatedDays}일</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">의무 여부</p>
          <p className={`text-sm font-bold ${lic.isMandatory ? "text-red-400" : "text-gray-300"}`}>
            {lic.isMandatory ? "영업 전 필수 취득" : "권장 사항"}
          </p>
        </div>
      </div>

      {lic.requiredDocuments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-300">📎 준비 서류</p>
          <ul className="space-y-1">
            {lic.requiredDocuments.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-orange-500 flex-shrink-0">·</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lic.onlineApplicationUrl && (
        <a
          href={lic.onlineApplicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-xl transition text-sm"
        >
          온라인 신청하기 →
        </a>
      )}
    </div>
  );
}

function IngredientModal({ ing }: { ing: IngredientRule }) {
  const isBlocked = ing.ruleType === "PROHIBITED";
  return (
    <div className="p-6 space-y-5">
      <div className="pr-6 space-y-2">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${isBlocked ? "bg-red-900 text-red-300" : "bg-yellow-900 text-yellow-300"}`}>
          {isBlocked ? "사용 금지" : "제한 사용"}
        </span>
        <h2 className="text-lg font-bold">{ing.ingredientName}</h2>
      </div>

      {ing.restriction && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-1">
          <p className="text-xs text-gray-500">규제 내용</p>
          <p className="text-sm text-gray-200">{ing.restriction}</p>
        </div>
      )}
      {ing.legalBasis && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-semibold">법적 근거</p>
          <p className="text-sm text-gray-300">{ing.legalBasis}</p>
        </div>
      )}
      {ing.safetyNote && (
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-4">
          <p className="text-sm text-yellow-300">⚠️ {ing.safetyNote}</p>
        </div>
      )}
      {ing.alternativeSuggestion && (
        <div className="bg-green-950 border border-green-800 rounded-xl p-4 space-y-1">
          <p className="text-xs text-green-400 font-semibold">💡 대체 원료 제안</p>
          <p className="text-sm text-green-300">{ing.alternativeSuggestion}</p>
        </div>
      )}
    </div>
  );
}

function InfraModal({ infra }: { infra: InfraRequirement }) {
  const detail = INFRA_DESCRIPTIONS[infra.infraType];
  return (
    <div className="p-6 space-y-5">
      <div className="pr-6 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">{infra.infraType}</span>
          {infra.isMandatory && <span className="text-xs text-red-400 font-medium">필수</span>}
        </div>
        <h2 className="text-lg font-bold">{detail?.title ?? infra.infraType}</h2>
      </div>

      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-sm text-gray-300 leading-relaxed">{detail?.detail ?? infra.description}</p>
      </div>

      {detail?.howTo && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-300">📋 어떻게 구하나요?</p>
          <ul className="space-y-1">
            {detail.howTo.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-orange-500 font-mono flex-shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail?.estimatedCost && (
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">예상 비용</p>
          <p className="text-sm text-orange-400 font-medium">{detail.estimatedCost}</p>
        </div>
      )}

      {detail?.links && (
        <div className="flex flex-wrap gap-2">
          {detail.links.map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-gray-800 hover:bg-gray-700 text-orange-400 px-3 py-2 rounded-lg transition">
              {link.label} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function LawModal({ law }: { law: string }) {
  const detail = LAW_DESCRIPTIONS[law];
  return (
    <div className="p-6 space-y-5">
      <h2 className="text-lg font-bold pr-6">{law}</h2>
      {detail ? (
        <>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-300 leading-relaxed">{detail.summary}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-300">📌 핵심 적용 포인트</p>
            <ul className="space-y-1.5">
              {detail.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-orange-500 flex-shrink-0">·</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          {detail.link && (
            <a href={detail.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition text-sm">
              법령 원문 보기 →
            </a>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">이 법령의 상세 설명은 준비 중입니다.</p>
      )}
    </div>
  );
}

function LegalPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [rawText, setRawText] = useState("");
  const [modal, setModal] = useState<ModalContent | null>(null);

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    setTriage(session.triage);
    setRawText(session.rawText);
  }, [sessionId, router]);

  if (!triage) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">분석 결과를 불러오는 중...</div>;
  }

  const status = STATUS_CONFIG[triage.legalStatus];
  const cat = triage.matchedCategory;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {modal && <Modal content={modal} onClose={() => setModal(null)} />}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/builder/setup?session=${sessionId}`)}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
            ← 뒤로
          </button>
          <span className="text-gray-700">|</span>
          <span className="text-xl font-bold">오프오프 빌더</span>
        </div>
        <div className="flex gap-2 text-xs text-gray-500">
          {["법적 타당성", "인허가·서류", "소싱·예산", "안전·라벨", "물류·채널"].map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded ${i === 0 ? "bg-orange-500 text-white" : "bg-gray-800"}`}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="text-sm text-gray-400">
          입력한 아이디어: <span className="text-white">"{rawText}"</span>
        </div>

        {/* 법적 상태 배지 */}
        <div className={`border rounded-xl p-6 space-y-2 ${status.bg}`}>
          <p className={`text-xl font-bold ${status.color}`}>{status.label}</p>
          <p className="text-gray-300 text-sm">
            분류된 사업 유형: <span className="text-white font-semibold">{cat.categoryName}</span>
            <span className="ml-2 text-xs text-gray-500">({cat.industryGroup})</span>
          </p>
        </div>

        {triage.legalStatus === "BLOCKED" && triage.alternativeSuggestion && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-2">
            <p className="text-orange-400 font-semibold">💡 우회 가능한 방법</p>
            <p className="text-gray-300 text-sm">{triage.alternativeSuggestion}</p>
          </div>
        )}

        {/* 주의 원료 */}
        {triage.flaggedIngredients.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">⚠️ 주의 원료</h2>
            <p className="text-xs text-gray-500">항목을 클릭하면 상세 규제 내용과 대체 원료를 확인할 수 있습니다.</p>
            {triage.flaggedIngredients.map((ing, i) => (
              <button key={i} onClick={() => setModal({ type: "ingredient", data: ing })}
                className="w-full text-left bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg p-4 space-y-1 transition">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${ing.ruleType === "PROHIBITED" ? "bg-red-900 text-red-300" : "bg-yellow-900 text-yellow-300"}`}>
                    {ing.ruleType === "PROHIBITED" ? "사용 금지" : "제한 사용"}
                  </span>
                  <span className="font-medium">{ing.ingredientName}</span>
                  <span className="ml-auto text-xs text-gray-600">자세히 →</span>
                </div>
                {ing.restriction && <p className="text-sm text-gray-400 truncate">{ing.restriction}</p>}
              </button>
            ))}
          </div>
        )}

        {/* 적용 법령 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">📋 적용 법령</h2>
          <p className="text-xs text-gray-500">클릭하면 핵심 적용 포인트와 법령 원문을 확인할 수 있습니다.</p>
          <div className="flex flex-wrap gap-2">
            {cat.governingLaw.map((law) => (
              <button key={law} onClick={() => setModal({ type: "law", data: law })}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition flex items-center gap-1">
                {law}
                <span className="text-gray-600 text-xs">↗</span>
              </button>
            ))}
          </div>
        </div>

        {/* 필수 인허가 미리보기 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">🔑 필요한 인허가 ({cat.requiredLicenses.length}개)</h2>
          <p className="text-xs text-gray-500">클릭하면 준비 서류와 온라인 신청 방법을 확인할 수 있습니다.</p>
          <div className="space-y-2">
            {cat.requiredLicenses.map((lic) => (
              <button key={lic.licenseId} onClick={() => setModal({ type: "license", data: lic })}
                className="w-full text-left flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-3 transition">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${lic.isMandatory ? "bg-red-400" : "bg-gray-500"}`} />
                  <span className="text-sm">{lic.licenseName}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">약 {lic.estimatedDays}일</span>
                  {lic.isMandatory && <span className="text-xs text-red-400">필수</span>}
                  <span className="text-gray-600 text-xs">자세히 →</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 필요 인프라 */}
        {cat.requiredInfrastructure.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">🏭 필요 인프라</h2>
            <p className="text-xs text-gray-500">클릭하면 구하는 방법과 예상 비용을 확인할 수 있습니다.</p>
            {cat.requiredInfrastructure.map((infra, i) => (
              <button key={i} onClick={() => setModal({ type: "infra", data: infra })}
                className="w-full text-left bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg p-4 transition">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">{infra.infraType}</span>
                  {infra.isMandatory && <span className="text-xs text-red-400">필수</span>}
                  <span className="ml-auto text-gray-600 text-xs">자세히 →</span>
                </div>
                <p className="text-sm text-gray-300">{infra.description}</p>
              </button>
            ))}
          </div>
        )}

        {cat.notes && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
            <p className="text-blue-300 text-sm">📌 {cat.notes}</p>
          </div>
        )}

        <div className="pt-4">
          {triage.legalStatus !== "BLOCKED" ? (
            <button onClick={() => router.push(`/builder/licensing?session=${sessionId}`)}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-4 rounded-xl transition text-lg">
              STEP 2: 인허가 서류 자동 생성 →
            </button>
          ) : (
            <button onClick={() => router.push("/")}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition text-lg">
              ← 아이디어 다시 입력하기
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LegalPage() {
  return <Suspense><LegalPageInner /></Suspense>;
}

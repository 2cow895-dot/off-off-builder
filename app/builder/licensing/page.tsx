"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { TriageResult, LicenseItem, BusinessInfo, BusinessMethod } from "@/types";

// 사업 방식별 추가 인허가
function getMethodLicenses(method: BusinessMethod): LicenseItem[] {
  if (method === "import_resell") {
    return [
      {
        licenseId: "METHOD-IMP-001",
        licenseName: "수입식품 등 수입판매업 신고",
        issuingAuthority: "식품의약품안전처 (수입식품정보마루)",
        isMandatory: true,
        estimatedDays: 7,
        onlineApplicationUrl: "https://impfood.mfds.go.kr",
        requiredDocuments: ["수입판매업 신고서", "사업장 평면도", "사업자등록증"],
      },
      {
        licenseId: "METHOD-IMP-002",
        licenseName: "수입식품 사전신고 (건별)",
        issuingAuthority: "식품의약품안전처",
        isMandatory: true,
        estimatedDays: 3,
        onlineApplicationUrl: "https://impfood.mfds.go.kr",
        requiredDocuments: ["수입신고서", "위생증명서 (원산지 발행)", "성분분석서(COA)", "포장·라벨 사진"],
      },
      {
        licenseId: "METHOD-IMP-003",
        licenseName: "관세 신고 (관세사 선임)",
        issuingAuthority: "관세청",
        isMandatory: true,
        estimatedDays: 2,
        onlineApplicationUrl: "https://unipass.customs.go.kr",
        requiredDocuments: ["인보이스", "패킹리스트", "B/L 또는 AWB", "원산지증명서"],
      },
      {
        licenseId: "METHOD-IMP-004",
        licenseName: "소분판매업 신고 (재포장 시)",
        issuingAuthority: "관할 구청",
        isMandatory: false,
        estimatedDays: 7,
        onlineApplicationUrl: "https://www.gov.kr",
        requiredDocuments: ["소분판매업 신고서", "시설 평면도", "식품위생교육 이수증"],
      },
    ];
  }
  if (method === "oem") {
    return [
      {
        licenseId: "METHOD-OEM-001",
        licenseName: "OEM 제조사 계약 체결",
        issuingAuthority: "자체 (법무사 검토 권장)",
        isMandatory: true,
        estimatedDays: 14,
        onlineApplicationUrl: "",
        requiredDocuments: ["OEM 제조계약서", "품질보증서", "제조물책임보험 가입 확인"],
      },
      {
        licenseId: "METHOD-OEM-002",
        licenseName: "상표 출원 (브랜드 보호)",
        issuingAuthority: "특허청",
        isMandatory: false,
        estimatedDays: 180,
        onlineApplicationUrl: "https://www.kipris.or.kr",
        requiredDocuments: ["상표 출원서", "상표 도안", "지정상품 목록"],
      },
      {
        licenseId: "METHOD-OEM-003",
        licenseName: "제조물책임(PL)보험 가입",
        issuingAuthority: "보험사 (삼성·현대·KB 등)",
        isMandatory: false,
        estimatedDays: 3,
        onlineApplicationUrl: "",
        requiredDocuments: ["사업자등록증", "제품 사양서"],
      },
    ];
  }
  if (method === "popup") {
    return [
      {
        licenseId: "METHOD-POP-001",
        licenseName: "임시영업신고 (5일 이하 식품판매)",
        issuingAuthority: "관할 구청 위생과",
        isMandatory: true,
        estimatedDays: 1,
        onlineApplicationUrl: "https://www.gov.kr",
        requiredDocuments: ["임시영업신고서", "영업 장소 사용 동의서", "식품위생교육 이수증"],
      },
      {
        licenseId: "METHOD-POP-002",
        licenseName: "팝업 장소 임대 계약",
        issuingAuthority: "팝업 플랫폼 또는 건물주",
        isMandatory: true,
        estimatedDays: 7,
        onlineApplicationUrl: "https://www.popupstore.co.kr",
        requiredDocuments: ["임대차계약서 또는 사용 확인서"],
      },
    ];
  }
  return []; // self_manufacture: 공통 인허가로 충분
}

// 사업자등록 + 통신판매업 신고는 업종 불문 공통 필수
function getCommonLicenses(info: BusinessInfo): LicenseItem[] {
  const licenses: LicenseItem[] = [
    {
      licenseId: "COMMON-001",
      licenseName: info.businessType === "corporation"
        ? "법인 설립 등기 + 사업자등록"
        : "개인사업자등록",
      issuingAuthority: info.businessType === "corporation"
        ? "법원 등기소 → 관할 세무서"
        : "관할 세무서 또는 홈택스 (무료)",
      isMandatory: true,
      estimatedDays: info.businessType === "corporation" ? 14 : 3,
      onlineApplicationUrl: "https://www.hometax.go.kr",
      requiredDocuments: info.businessType === "corporation"
        ? ["정관", "발기인 총회 의사록", "임원 취임 승낙서", "법인 인감"]
        : ["사업자등록신청서", "임대차계약서 (사업장 소재지)", "신분증"],
    },
  ];

  if (info.salesChannel === "online_only" || info.salesChannel === "both") {
    licenses.push({
      licenseId: "COMMON-002",
      licenseName: "통신판매업 신고",
      issuingAuthority: "공정거래위원회 (정부24 온라인 신청)",
      isMandatory: true,
      estimatedDays: 7,
      onlineApplicationUrl: "https://www.gov.kr",
      requiredDocuments: ["통신판매업 신고서", "사업자등록증 사본", "구매안전서비스 이용 확인증"],
    });
  }

  if (info.hasPhysicalStore) {
    licenses.push({
      licenseId: "COMMON-003",
      licenseName: "소방 완비증명서 (다중이용업소 해당 시)",
      issuingAuthority: "관할 소방서",
      isMandatory: false,
      estimatedDays: 14,
      onlineApplicationUrl: "",
      requiredDocuments: ["소방시설 완비증명서 신청서", "임대차계약서"],
    });
  }

  if (info.hasBusinessName && info.needsTrademark) {
    licenses.push({
      licenseId: "COMMON-004",
      licenseName: "상표 출원 (특허청)",
      issuingAuthority: "특허청 (키프리스)",
      isMandatory: false,
      estimatedDays: 180,
      onlineApplicationUrl: "https://www.kipris.or.kr",
      requiredDocuments: ["상표 출원서", "상표 도안", "지정상품 목록"],
    });
  }

  return licenses;
}

function LicensingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [checkedLicenses, setCheckedLicenses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    setTriage(session.triage);
    setBusinessInfo(session.businessInfo ?? null);
  }, [sessionId, router]);

  if (!triage) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">불러오는 중...</div>;
  }

  const cat = triage.matchedCategory;
  const commonLicenses = businessInfo ? getCommonLicenses(businessInfo) : [];
  const methodLicenses = businessInfo?.businessMethod ? getMethodLicenses(businessInfo.businessMethod) : [];
  const mandatory = cat.requiredLicenses.filter(l => l.isMandatory);
  const optional = cat.requiredLicenses.filter(l => !l.isMandatory);
  const totalDays = [...commonLicenses, ...methodLicenses, ...mandatory].reduce((sum, l) => Math.max(sum, l.estimatedDays), 0);

  const METHOD_LABELS: Record<string, string> = {
    self_manufacture: "직접 제조·판매",
    import_resell: "수입 후 판매",
    oem: "OEM 위탁 제조",
    popup: "팝업·단기 운영",
  };

  function toggleCheck(id: string) {
    setCheckedLicenses(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function goNext() {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) return;
    const session = JSON.parse(stored);
    session.currentStep = 2;
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    // 결제(또는 베타 이메일 인증) 완료 시 sourcing으로, 아니면 paywall로
    if (session.paid) {
      router.push(`/builder/sourcing?session=${sessionId}`);
    } else {
      router.push(`/builder/paywall?session=${sessionId}`);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">오프오프 빌더</span>
        <div className="flex gap-2 text-xs text-gray-500">
          {["법적 타당성", "인허가·서류", "소싱·예산", "안전·라벨", "물류·채널"].map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded ${i === 1 ? "bg-orange-500 text-white" : "bg-gray-800"}`}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* 요약 */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">인허가 및 행정 서류</h1>
          <p className="text-gray-400 text-sm">
            <span className="text-white font-medium">{cat.categoryName}</span> 기준 —
            총 인허가 {commonLicenses.length + mandatory.length}개, 최대 소요 기간 약 {totalDays}일
          </p>
          {businessInfo?.businessName && (
            <p className="text-sm text-orange-400">상호명 "{businessInfo.businessName}" 기준으로 서류가 자동 완성됩니다.</p>
          )}
        </div>

        {/* 공통 인허가 — 업종 불문 필수 */}
        {commonLicenses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🏢 사업 공통 인허가
              <span className="text-xs text-gray-400 font-normal">업종 관계없이 모든 창업자 해당</span>
            </h2>
            {commonLicenses.map(lic => (
              <LicenseCard key={lic.licenseId} lic={lic} checked={!!checkedLicenses[lic.licenseId]} onToggle={() => toggleCheck(lic.licenseId)} />
            ))}
          </div>
        )}

        {/* 사업 방식별 인허가 */}
        {methodLicenses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🎯 사업 방식별 인허가
              <span className="text-xs text-purple-400 font-normal">
                {businessInfo?.businessMethod ? METHOD_LABELS[businessInfo.businessMethod] : ""}
              </span>
            </h2>
            {methodLicenses.map(lic => (
              <LicenseCard key={lic.licenseId} lic={lic} checked={!!checkedLicenses[lic.licenseId]} onToggle={() => toggleCheck(lic.licenseId)} />
            ))}
          </div>
        )}

        {/* 업종별 인허가 체크리스트 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🔑 업종별 필수 인허가
            <span className="text-xs text-red-400 font-normal">모두 취득 후 영업 가능</span>
          </h2>
          {mandatory.map((lic) => (
            <LicenseCard key={lic.licenseId} lic={lic} checked={!!checkedLicenses[lic.licenseId]} onToggle={() => toggleCheck(lic.licenseId)} />
          ))}
        </div>

        {optional.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-400">선택 인허가</h2>
            {optional.map((lic) => (
              <LicenseCard key={lic.licenseId} lic={lic} checked={!!checkedLicenses[lic.licenseId]} onToggle={() => toggleCheck(lic.licenseId)} optional />
            ))}
          </div>
        )}

        {/* 자동 생성 서류 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📄 자동 생성 서류</h2>
          <p className="text-sm text-gray-400">아래 서류 양식은 입력하신 사업 정보 기반으로 자동 완성됩니다.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cat.autoGeneratedDocuments.map((docType) => (
              <DocumentCard key={docType} docType={docType} sessionId={sessionId!} category={cat.categoryName} businessInfo={businessInfo} />
            ))}
          </div>
        </div>

        {/* 필요 인프라 */}
        {cat.requiredInfrastructure.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">🏭 필요 오프라인 인프라</h2>
            {cat.requiredInfrastructure.map((infra, i) => (
              <div key={i} className={`rounded-xl p-4 border ${infra.isMandatory ? "border-orange-800 bg-orange-950" : "border-gray-800 bg-gray-900"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{infra.infraType}</span>
                  {infra.isMandatory && <span className="text-xs text-orange-400">필수</span>}
                </div>
                <p className="text-sm text-gray-300">{infra.description}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={goNext}
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-4 rounded-xl transition text-lg"
        >
          STEP 3: 소싱·예산 계산 →
        </button>
      </div>
    </main>
  );
}

function LicenseCard({ lic, checked, onToggle, optional }: { lic: LicenseItem; checked: boolean; onToggle: () => void; optional?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 space-y-3 transition ${checked ? "border-green-700 bg-green-950" : "border-gray-800 bg-gray-900"}`}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition ${checked ? "bg-green-500 border-green-500" : "border-gray-600"}`}>
          {checked && <span className="text-white text-xs">✓</span>}
        </button>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{lic.licenseName}</span>
            {!optional && <span className="text-xs text-red-400">필수</span>}
          </div>
          <p className="text-sm text-gray-400">발급기관: {lic.issuingAuthority}</p>
          <p className="text-sm text-gray-400">소요기간: 약 {lic.estimatedDays}일</p>
          {lic.requiredDocuments.length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-gray-500 mb-1">준비 서류:</p>
              <div className="flex flex-wrap gap-1">
                {lic.requiredDocuments.map(doc => (
                  <span key={doc} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{doc}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        {lic.onlineApplicationUrl && (
          <a href={lic.onlineApplicationUrl} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 text-xs text-orange-400 hover:text-orange-300 underline">
            신청 →
          </a>
        )}
      </div>
    </div>
  );
}

const DOC_META: Record<string, { label: string; icon: string; desc: string }> = {
  BUSINESS_REGISTRATION: { label: "영업신고서", icon: "📋", desc: "관할 구청 제출용 영업신고 양식 자동 완성" },
  PRODUCT_MANUFACTURING_REPORT: { label: "품목제조보고서", icon: "🧪", desc: "제품명·원재료·제조공정 기재 양식" },
  LABEL_DRAFT: { label: "라벨 도안", icon: "🏷️", desc: "의무 표기사항이 채워진 라벨 초안" },
  HYGIENE_EDUCATION_CERTIFICATE: { label: "위생교육 이수증", icon: "📜", desc: "식품위생교육 이수 확인서 양식" },
};

function DocumentCard({ docType, sessionId, category, businessInfo }: {
  docType: string; sessionId: string; category: string; businessInfo: BusinessInfo | null;
}) {
  const meta = DOC_META[docType] || { label: docType, icon: "📄", desc: "" };
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    const content = generateDocumentContent(docType, category, businessInfo);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.label}_${sessionId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{meta.icon}</span>
        <div>
          <p className="font-medium text-sm">{meta.label}</p>
          <p className="text-xs text-gray-500">{meta.desc}</p>
        </div>
      </div>
      <button
        onClick={handleDownload}
        className={`w-full text-sm py-2 rounded-lg font-medium transition ${downloaded ? "bg-green-900 text-green-300" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
      >
        {downloaded ? "✓ 다운로드 완료" : "양식 다운로드"}
      </button>
    </div>
  );
}

function generateDocumentContent(docType: string, category: string, info: BusinessInfo | null): string {
  const date = new Date().toLocaleDateString("ko-KR");
  const name = info?.businessName || "___________________________";
  const region = info?.region || "___________________________";
  const templates: Record<string, string> = {
    BUSINESS_REGISTRATION: `
■ 영업신고서 (식품위생법 제37조)
작성일: ${date}

상호명: ${name}
대표자명: ___________________________
생년월일: ___________________________
영업소 소재지: ${region} ___________________________
영업의 종류: ${category}
영업장 면적: _____ m²

취급 품목: ___________________________
영업 개시 예정일: ___________________________

위와 같이 영업신고를 합니다.

첨부서류:
1. 시설 평면도
2. 식품위생교육 이수증
3. 건강진단결과서(보건증)
`,
    PRODUCT_MANUFACTURING_REPORT: `
■ 품목제조보고서
작성일: ${date}

제품명: ___________________________
식품의 유형: ___________________________
제조방법 설명서:
  1. 원료 준비: ___________________________
  2. 제조 공정: ___________________________
  3. 포장 방법: ___________________________

원재료 배합비율:
  - 원재료명: ___________ 함량: _______%
  - 원재료명: ___________ 함량: _______%

유통기한 설정 사유: ___________________________
보관방법: ___________________________
`,
    LABEL_DRAFT: `
■ 제품 라벨 필수 표기사항
작성일: ${date}

[전면]
제품명: ___________________________
내용량: ___________g (___________kcal)
유통기한: ___________________________

[후면]
식품의 유형: ___________________________
원재료명 및 함량: ___________________________
보관방법: ___________________________
제조원: ___________________________
소재지: ___________________________
주의사항: ___________________________

알레르기 유발 원재료: ___________________________

※ 이 양식은 식품등의 표시·광고에 관한 법률 기준으로 작성되었습니다.
`,
    HYGIENE_EDUCATION_CERTIFICATE: `
■ 식품위생교육 이수 안내
작성일: ${date}

교육 기관: 한국식품산업협회 / 한국외식업중앙회
교육 구분: 신규 영업자 교육 (6시간)
수강 신청: https://www.kfia.or.kr

이수 후 발급받은 이수증을 영업신고 시 첨부하세요.
`,
  };
  return (templates[docType] || `${docType} 서류 양식\n작성일: ${date}\n`).trim();
}

export default function LicensingPage() {
  return (
    <Suspense>
      <LicensingPageInner />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { TriageResult } from "@/types";

// 카테고리별 안전 리스크 체크리스트
const SAFETY_CHECKLISTS: Record<string, { id: string; label: string; detail: string; critical: boolean }[]> = {
  FOOD_MANUFACTURING: [
    { id: "s1", label: "원재료 식용 등급(Food Grade) 확인", detail: "모든 원료의 식품첨가물공전 수재 여부 또는 GRAS 인증 확인", critical: true },
    { id: "s2", label: "공유주방 위생 상태 점검", detail: "조리 전 작업대·도구 소독, 교차오염 방지", critical: true },
    { id: "s3", label: "작업자 보건증 및 위생복 착용", detail: "보건증 유효기간 내, 위생모·위생복·위생장갑 착용", critical: true },
    { id: "s4", label: "제조 온도 관리", detail: "버터 등 유제품 0~5°C 냉장 보관, 제조 후 즉시 냉각", critical: false },
    { id: "s5", label: "허브 인화점 확인 (캔들류)", detail: "에센셜 오일 인화점 측정 — 73°C 미만 시 소방법 기준 적용", critical: true },
    { id: "s6", label: "알레르기 원재료 별도 관리", detail: "견과류·유제품·밀 등 7대 알레르기 원료 교차오염 방지", critical: true },
  ],
  FOOD_SERVICE_CAFE: [
    { id: "s1", label: "음용수 수질 기준 적합 확인", detail: "정수기 필터 교체 주기 준수, 연 1회 수질 검사 권장", critical: true },
    { id: "s2", label: "냉장·냉동 온도 일지 관리", detail: "냉장 0~5°C, 냉동 -18°C 이하 유지 및 일지 기록", critical: true },
    { id: "s3", label: "원두 보관 조건", detail: "직사광선·습기 차단, 개봉 후 밀봉 보관", critical: false },
    { id: "s4", label: "유통기한 라벨 부착", detail: "당일 제조 음료 유통기한 표시 (냉장 기준)", critical: false },
  ],
  COSMETICS_MANUFACTURE: [
    { id: "s1", label: "원료 화장품 등급 인증 확인", detail: "공급업체 COA(성적서) 수령, 화장품 원료 기준 적합 확인", critical: true },
    { id: "s2", label: "pH 기준 적합 확인", detail: "피부 직접 접촉 제품 pH 3~9 범위 내 확인", critical: true },
    { id: "s3", label: "방부제 함량 기준 준수", detail: "파라벤 0.8% 이하, 페녹시에탄올 1% 이하", critical: true },
    { id: "s4", label: "안정성 테스트 (온도 사이클)", detail: "45°C 4주, -5°C 4주 교대 보관 후 분리·변색 확인", critical: false },
    { id: "s5", label: "패치 테스트 시행", detail: "제품 출시 전 피부 자극 패치 테스트 (48시간)", critical: false },
  ],
  CHEMICAL_PRODUCT: [
    { id: "s1", label: "CMIT/MIT 성분 완전 배제 확인", detail: "사용 금지 성분 — 원료 MSDS에서 CAS No. 확인 필수", critical: true },
    { id: "s2", label: "생활화학제품 안전확인신고 완료", detail: "신고 전 제품 판매 불가. 신고번호 라벨 표기 의무", critical: true },
    { id: "s3", label: "인화성 물질 보관 기준 준수", detail: "인화점 60°C 미만 물질 10L 이상 보관 시 소방서 신고", critical: true },
    { id: "s4", label: "어린이 보호 포장 적용", detail: "어린이 안전 포장 기준 — 세정제·탈취제 개봉 방지 포장", critical: false },
  ],
  TEXTILE_APPAREL: [
    { id: "s1", label: "원단 아조염료 검사 성적서 확인", detail: "피부 접촉 원단 아조염료 30mg/kg 이하 — 납품사 성적서 요청", critical: true },
    { id: "s2", label: "포름알데히드 함량 기준 확인", detail: "직접 피부 접촉 제품 300ppm 이하 — 원단 구매 시 성적서 확인", critical: false },
    { id: "s3", label: "혼용률 표시 정확성 확인", detail: "성분 혼용률(면 100%, 폴리 30% 등) 원단 공급사 확인 후 라벨 기재", critical: true },
    { id: "s4", label: "세탁 취급 기호 KS 기준 적용", detail: "KS K ISO 3758 기준 세탁 기호 라벨에 인쇄", critical: false },
  ],
  CHILDREN_PRODUCT: [
    { id: "s1", label: "KC 안전확인신고 완료 여부", detail: "신고번호 없이 어린이 제품 판매 금지 — 최우선 확인 사항", critical: true },
    { id: "s2", label: "프탈레이트계 가소제 검사", detail: "DEHP·DBP·BBP 각 0.1% 이하 — 공인기관 시험성적서 필수", critical: true },
    { id: "s3", label: "끈·줄 길이 규정 준수", detail: "7세 이하 목 부위 끈 금지, 후드 끈 14.5cm 이하", critical: true },
    { id: "s4", label: "소형 부품 질식 위험 확인", detail: "36개월 미만 대상 제품: 지름 31.7mm 이하 부품 사용 금지", critical: true },
    { id: "s5", label: "형광증백제 미사용 확인", detail: "피부 직접 접촉 어린이 의류에 형광증백제 사용 불가", critical: true },
  ],
  PET_FOOD: [
    { id: "s1", label: "포도·건포도 원료 배제 확인", detail: "개·고양이 신장 독성 — 소량도 치명적. 원료 성분표 전수 확인", critical: true },
    { id: "s2", label: "자일리톨 미포함 확인", detail: "개 저혈당 유발 — 원료명 '자작나무 추출물' 포함 여부 확인", critical: true },
    { id: "s3", label: "카카오·초콜릿 원료 배제", detail: "테오브로민 중독 — 원료에 코코아·카카오 분말 포함 금지", critical: true },
    { id: "s4", label: "사료 품목등록 완료 확인", detail: "품목등록번호 없이 사료 판매 불가", critical: true },
    { id: "s5", label: "원료 신선도 및 보관 온도 관리", detail: "생육·신선 재료 냉장 보관(-1~5°C), 유통기한 내 사용", critical: true },
  ],
  HEALTH_FOOD: [
    { id: "s1", label: "기능성 원료 식약처 인정 여부 확인", detail: "고시형 또는 개별 인정 원료만 사용 가능", critical: true },
    { id: "s2", label: "GMP 기준 제조 확인", detail: "GMP 인증 시설에서 제조 — 인증서 사본 보관", critical: true },
    { id: "s3", label: "기능성 표현 적합성 검토", detail: "인정된 기능성 이외 표현 금지 — '질병 치료·예방' 표현 불가", critical: true },
  ],
};

const DEFAULT_CHECKLIST = [
  { id: "d1", label: "제품 안전성 자체 검토", detail: "사용 재료의 안전성 확인 및 기록 보관", critical: false },
  { id: "d2", label: "라벨 의무 표기사항 확인", detail: "법정 필수 표기사항 누락 여부 확인", critical: true },
  { id: "d3", label: "포장 안전성 검토", detail: "소비자 상해 방지를 위한 포장 설계 확인", critical: false },
];

function QCPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [labelFields, setLabelFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    if (!session.paid) { router.push(`/builder/paywall?session=${sessionId}`); return; }
    setTriage(session.triage);
  }, [sessionId, router]);

  if (!triage) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">불러오는 중...</div>;

  const cat = triage.matchedCategory;
  const checklist = SAFETY_CHECKLISTS[cat.categoryId] || DEFAULT_CHECKLIST;
  const criticalTotal = checklist.filter(c => c.critical).length;
  const criticalDone = checklist.filter(c => c.critical && checked[c.id]).length;
  const allCriticalDone = criticalDone === criticalTotal;

  function toggle(id: string) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function goNext() {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) return;
    const session = JSON.parse(stored);
    session.currentStep = 5;
    session.labelFields = labelFields;
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    router.push(`/builder/logistics?session=${sessionId}`);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">오프오프 빌더</span>
        <div className="flex gap-2 text-xs text-gray-500">
          {["법적 타당성", "인허가·서류", "소싱·예산", "안전·라벨", "물류·채널"].map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded ${i === 3 ? "bg-orange-500 text-white" : "bg-gray-800"}`}>{i + 1}. {s}</span>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">안전 검증 & 라벨 작성</h1>
          <p className="text-gray-400 text-sm">{cat.categoryName} 기준 필수 안전 항목 및 의무 표기사항</p>
        </div>

        {/* 안전 체크리스트 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">🛡️ 안전 체크리스트</h2>
            <span className={`text-sm font-medium ${allCriticalDone ? "text-green-400" : "text-red-400"}`}>
              필수 {criticalDone}/{criticalTotal} 완료
            </span>
          </div>

          {!allCriticalDone && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
              🚨 필수 항목을 모두 확인해야 다음 단계로 진행할 수 있습니다.
            </div>
          )}

          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item.id}
                onClick={() => toggle(item.id)}
                className={`rounded-xl border p-4 cursor-pointer transition ${checked[item.id] ? "border-green-700 bg-green-950" : item.critical ? "border-red-900 bg-gray-900" : "border-gray-800 bg-gray-900"}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${checked[item.id] ? "bg-green-500 border-green-500" : "border-gray-600"}`}>
                    {checked[item.id] && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.critical && <span className="text-xs text-red-400">필수</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 라벨 에디터 */}
        {cat.mandatoryLabelFields.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">🏷️ 라벨 필수 표기사항 작성</h2>
            <p className="text-sm text-gray-400">아래 항목을 작성하면 최종 리포트에 라벨 초안이 포함됩니다.</p>
            <div className="space-y-3">
              {cat.mandatoryLabelFields.map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">{field}</label>
                  <input
                    type="text"
                    value={labelFields[field] || ""}
                    onChange={e => setLabelFields(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={`${field} 입력...`}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
              ))}
            </div>

            {/* 라벨 미리보기 */}
            {Object.keys(labelFields).some(k => labelFields[k]) && (
              <div className="bg-white text-black rounded-xl p-6 space-y-2 mt-4">
                <p className="text-xs text-gray-500 mb-3 font-medium">[ 라벨 미리보기 ]</p>
                {cat.mandatoryLabelFields.map(field => (
                  labelFields[field] ? (
                    <div key={field} className="flex gap-2 text-sm">
                      <span className="font-semibold text-gray-700 flex-shrink-0">{field}:</span>
                      <span className="text-gray-900">{labelFields[field]}</span>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={goNext}
          disabled={!allCriticalDone}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition text-lg"
        >
          STEP 5: 물류 & 채널 설계 →
        </button>
      </div>
    </main>
  );
}

export default function QCPage() {
  return <Suspense><QCPageInner /></Suspense>;
}

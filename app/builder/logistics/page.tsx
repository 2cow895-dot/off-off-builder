"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { TriageResult } from "@/types";

const LOGISTICS_DATA: Record<string, {
  temperatureSensitive: boolean;
  coldChainRequired: boolean;
  packagingGuide: string[];
  shelfLifeNote: string;
}> = {
  FOOD_MANUFACTURING: { temperatureSensitive: true, coldChainRequired: true, packagingGuide: ["식품용 포장재(식약처 기준) 사용", "밀봉 포장 후 실링 처리", "버터류: 아이스팩 + 보냉백 필수", "외부 박스에 '냉장 보관' 스티커 부착", "충격 방지 완충재 삽입"], shelfLifeNote: "버터 기반 제품: 냉장 7~14일 / 냉동 1개월" },
  FOOD_INSTANT: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["식품용 포장지 사용", "당일 제조·판매 원칙", "보관 온도 표시 스티커 부착"], shelfLifeNote: "당일 제조 당일 판매 권장" },
  FOOD_SERVICE_CAFE: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["일회용 컵 친환경 기준 (2024년 규제 확인)", "테이크아웃 밀봉 처리", "배달 시 스필-프루프 포장"], shelfLifeNote: "음료 즉시 제공" },
  FOOD_SERVICE_RESTAURANT: { temperatureSensitive: true, coldChainRequired: false, packagingGuide: ["배달 용기 식품 안전 기준 적합", "보온·보냉 배달백 사용", "국물류: 누수 방지 이중 포장"], shelfLifeNote: "조리 후 2시간 내 소비 권장" },
  HEALTH_FOOD: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["습기·직사광선 차단 포장", "PTP 포장 또는 병 포장", "건조제 동봉"], shelfLifeNote: "건조 제품 통상 12~24개월" },
  LIVESTOCK_PROCESSING: { temperatureSensitive: true, coldChainRequired: true, packagingGuide: ["HACCP 기준 진공 포장", "냉장(-1~5°C) 또는 냉동(-18°C 이하)", "아이스팩 + 스티로폼 박스"], shelfLifeNote: "냉장 5~7일 / 냉동 3개월" },
  COSMETICS_MANUFACTURE: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["차광 용기 또는 UV 차단 포장", "에어리스 펌프 용기 (산화 방지)", "충격 방지 에어캡 포장"], shelfLifeNote: "미개봉 12~24개월, 개봉 후 6~12개월" },
  COSMETICS_CUSTOM: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["소분 용기 밀봉 처리", "제조일·사용기한 라벨 부착", "직사광선 차단 포장"], shelfLifeNote: "개봉 후 3~6개월" },
  QUASI_DRUG: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["의약외품 표준 포장 기준 준수", "어린이 보호 포장 (해당 시)", "방습·차광 포장"], shelfLifeNote: "품목별 허가사항 준수" },
  TEXTILE_APPAREL: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["OPP 비닐백 개별 포장", "행거 배송 또는 접어서 박스 포장", "습기 방지 실리카겔 동봉 (장기 보관 시)", "브랜드 택·라벨 부착"], shelfLifeNote: "섬유 제품 유통기한 없음 (보관 상태 중요)" },
  CHILDREN_PRODUCT: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["소형 부품 별도 포장 및 경고 표시", "어린이 보호 포장 적용", "KC 인증 마크 외부 박스 표시", "질식·삼킴 주의 경고 문구 부착"], shelfLifeNote: "섬유·플라스틱 제품 유통기한 없음" },
  LEATHER_GOODS: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["부직포 파우치 또는 먼지 방지 백 포장", "실리카겔 동봉 (습기 방지)", "에어캡 완충 후 박스 포장", "금속 부자재 부식 방지 처리"], shelfLifeNote: "가죽 제품 유통기한 없음 (관리 방법 중요)" },
  CHEMICAL_PRODUCT: { temperatureSensitive: true, coldChainRequired: false, packagingGuide: ["안전확인번호 외부 박스 표시 의무", "직사광선·고온 차단 포장 (50°C 이상 변형)", "인화성 물질 경고 스티커 부착", "밀봉 포장 — 향기 누출 방지"], shelfLifeNote: "캔들·방향제 통상 12개월" },
  FURNITURE_INTERIOR: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["모서리 코너 가드 부착", "에어캡 + 크래프트지 포장", "조립품: 부품별 비닐 포장 후 박스", "취급 주의 스티커 부착"], shelfLifeNote: "목재 제품 유통기한 없음" },
  ELECTRICAL_GOODS: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["KC 인증 마크 포장 외부 표시 의무", "정전기 방지 비닐 포장 (전자부품)", "충격 방지 스티로폼 내장 박스", "전원 코드 분리 포장"], shelfLifeNote: "전기용품 통상 1~2년 보증" },
  PLANT_FLOWER: { temperatureSensitive: true, coldChainRequired: false, packagingGuide: ["화분 흙 흘림 방지 비닐 랩핑", "줄기·잎 보호 습지 포장", "배송 상자 통기공 확보", "직사광선·고온 노출 최소화 (5°C 이하 냉해 주의)"], shelfLifeNote: "식물 품종별 배송 가능 기간 상이 (1~3일 내 권장)" },
  ORGANIC_AGRI: { temperatureSensitive: true, coldChainRequired: false, packagingGuide: ["유기농 인증 마크 포장 표시", "친환경 포장재 사용 권장 (생분해 소재)", "신선도 유지 밀봉 포장"], shelfLifeNote: "신선 농산물: 냉장 3~7일 / 건조 가공품: 6개월~1년" },
  PET_FOOD: { temperatureSensitive: true, coldChainRequired: false, packagingGuide: ["사료관리법 기준 포장재 사용", "밀봉 포장 + 지퍼백 또는 밀봉 클립", "냉장 제품: 아이스팩 동봉", "사료 성분등록번호 라벨 표시 의무"], shelfLifeNote: "수제 간식: 냉장 7일 / 냉동 30일 / 건조 60일" },
  PET_GOODS: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["OPP 비닐백 포장", "브랜드 택 부착", "에어캡 완충 포장"], shelfLifeNote: "반려동물 용품 유통기한 없음" },
  CLASS_STUDIO: { temperatureSensitive: false, coldChainRequired: false, packagingGuide: ["수업 재료 키트: 재료별 소분 포장", "키트 설명서 동봉", "취급 주의 재료 (칼·바늘 등) 별도 안전 포장"], shelfLifeNote: "수업 키트는 수강 전 전달 권장" },
};

const CHANNEL_DATA: Record<string, { name: string; type: string; entryCondition: string; fee: string; strength: string; url: string }[]> = {
  FOOD_MANUFACTURING: [
    { name: "스마트스토어", type: "온라인", entryCondition: "사업자등록증 + 통신판매업 신고", fee: "판매 수수료 2~5.85%", strength: "초기 진입 쉬움, 네이버 검색 노출", url: "https://sell.smartstore.naver.com" },
    { name: "마켓컬리", type: "온라인 신선", entryCondition: "입점 심사 (품질·위생 기준 엄격), HACCP 또는 우수 제조 기준", fee: "판매 수수료 20~30%", strength: "고급 식품 타깃 고객", url: "https://partner.kurly.com" },
    { name: "오프라인 팝업·마켓", type: "오프라인", entryCondition: "즉석판매제조가공업 신고 + 행사 참가 신청", fee: "부스 임대료 3~15만원/회", strength: "브랜드 인지도 구축, 직접 고객 피드백", url: "" },
    { name: "쿠팡 로켓그로스", type: "온라인", entryCondition: "사업자등록 + KC 또는 식품 인증", fee: "판매 수수료 10.8%~", strength: "빠른 배송으로 구매 전환율 높음", url: "https://wing.coupang.com" },
  ],
  FOOD_SERVICE_CAFE: [
    { name: "배달의민족", type: "배달 앱", entryCondition: "일반음식점 또는 휴게음식점 영업신고증", fee: "중개 수수료 6.8% + 광고비", strength: "배달 수요 높음", url: "https://biz.baemin.com" },
    { name: "카카오맵 등록", type: "로컬", entryCondition: "사업자등록증", fee: "무료", strength: "오프라인 방문 고객 유입", url: "https://business.kakao.com" },
    { name: "인스타그램 샵", type: "SNS", entryCondition: "사업자 계정 + 카탈로그 등록", fee: "무료 (광고비 별도)", strength: "비주얼 콘텐츠 마케팅 효과", url: "https://www.instagram.com" },
  ],
  TEXTILE_APPAREL: [
    { name: "스마트스토어", type: "온라인", entryCondition: "사업자등록증 + 통신판매업 신고", fee: "판매 수수료 2~5.85%", strength: "초기 진입 쉬움", url: "https://sell.smartstore.naver.com" },
    { name: "에이블리", type: "패션 플랫폼", entryCondition: "사업자등록 + 입점 신청", fee: "판매 수수료 10%", strength: "패션 특화 여성 고객층", url: "https://www.ably.kr" },
    { name: "29CM", type: "패션 플랫폼", entryCondition: "브랜드 입점 심사 (디자인·품질 기준)", fee: "판매 수수료 15~20%", strength: "프리미엄 감성 패션 고객", url: "https://www.29cm.co.kr" },
    { name: "오프라인 팝업·플리마켓", type: "오프라인", entryCondition: "참가 신청", fee: "부스 임대료 5~20만원/회", strength: "브랜드 스토리 전달, 직접 피팅 가능", url: "" },
  ],
  COSMETICS_MANUFACTURE: [
    { name: "올리브영 입점", type: "오프라인·온라인", entryCondition: "화장품책임판매업 등록 + 입점 심사", fee: "판매 수수료 30~40%", strength: "국내 최대 뷰티 유통 채널", url: "https://www.cjenm.com/ko/brands/olive-young/" },
    { name: "스마트스토어", type: "온라인", entryCondition: "사업자등록 + 통신판매업 신고", fee: "2~5.85%", strength: "초기 D2C 브랜딩", url: "https://sell.smartstore.naver.com" },
    { name: "화해 앱 등록", type: "뷰티 플랫폼", entryCondition: "제품 정보 등록 (전성분 필수)", fee: "무료", strength: "성분 중시 뷰티 고객 노출", url: "https://www.hwahae.co.kr" },
    { name: "텐바이텐", type: "라이프스타일", entryCondition: "입점 신청 + 심사", fee: "판매 수수료 25%", strength: "감성 라이프스타일 고객층", url: "https://www.10x10.co.kr" },
  ],
  CHEMICAL_PRODUCT: [
    { name: "스마트스토어", type: "온라인", entryCondition: "사업자등록 + 안전확인신고번호 필수", fee: "2~5.85%", strength: "초기 진입", url: "https://sell.smartstore.naver.com" },
    { name: "아이디어스", type: "핸드메이드 플랫폼", entryCondition: "작가 등록 + 안전확인신고 완료", fee: "판매 수수료 15%", strength: "핸드메이드 감성 고객, 캔들 수요 높음", url: "https://www.idus.com" },
    { name: "오프라인 팝업", type: "오프라인", entryCondition: "안전확인신고 완료 + 참가 신청", fee: "부스 임대료", strength: "향기 직접 체험 가능 — 캔들·방향제 특화", url: "" },
  ],
  PET_FOOD: [
    { name: "스마트스토어", type: "온라인", entryCondition: "사업자등록 + 사료제조업 등록증 + 품목등록번호", fee: "2~5.85%", strength: "반려동물 용품 수요 높음", url: "https://sell.smartstore.naver.com" },
    { name: "펫프렌즈", type: "반려동물 전문", entryCondition: "입점 심사 (성분·안전 기준)", fee: "판매 수수료 15~20%", strength: "반려동물 특화 고객층", url: "https://www.petfriends.co.kr" },
    { name: "쿠팡", type: "온라인", entryCondition: "사업자등록 + 사료 관련 인증", fee: "10.8%~", strength: "반려동물 카테고리 성장세", url: "https://wing.coupang.com" },
  ],
  CLASS_STUDIO: [
    { name: "크몽", type: "클래스 플랫폼", entryCondition: "전문가 등록", fee: "서비스 수수료 20%", strength: "수업 검색 노출", url: "https://kmong.com" },
    { name: "탈잉", type: "클래스 플랫폼", entryCondition: "튜터 등록 + 강의 심사", fee: "판매 수수료 20%", strength: "원데이클래스 특화", url: "https://taling.me" },
    { name: "클래스101", type: "클래스 플랫폼", entryCondition: "크리에이터 신청 + 심사", fee: "수수료 30%", strength: "온·오프라인 통합 수업", url: "https://class101.net" },
    { name: "인스타그램", type: "SNS", entryCondition: "계정 개설", fee: "무료 (광고비 별도)", strength: "공방 감성 콘텐츠 마케팅 최적화", url: "https://www.instagram.com" },
  ],
};

const DEFAULT_CHANNELS = [
  { name: "스마트스토어", type: "온라인", entryCondition: "사업자등록증 + 통신판매업 신고", fee: "2~5.85%", strength: "초기 D2C 채널", url: "https://sell.smartstore.naver.com" },
  { name: "아이디어스", type: "핸드메이드 플랫폼", entryCondition: "작가 등록", fee: "15%", strength: "핸드메이드 감성 고객", url: "https://www.idus.com" },
  { name: "오프라인 팝업", type: "오프라인", entryCondition: "참가 신청", fee: "부스 임대료", strength: "직접 고객 접촉", url: "" },
];

function LogisticsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [triage, setTriage] = useState<TriageResult | null>(null);

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
  const logistics = LOGISTICS_DATA[cat.categoryId] || LOGISTICS_DATA.FOOD_MANUFACTURING;
  const channels = CHANNEL_DATA[cat.categoryId] || DEFAULT_CHANNELS;

  function goReport() {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) return;
    const session = JSON.parse(stored);
    session.currentStep = 5;
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    router.push(`/builder/report?session=${sessionId}`);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">오프오프 빌더</span>
        <div className="flex gap-2 text-xs text-gray-500">
          {["법적 타당성", "인허가·서류", "소싱·예산", "안전·라벨", "물류·채널"].map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded ${i === 4 ? "bg-orange-500 text-white" : "bg-gray-800"}`}>{i + 1}. {s}</span>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">물류 설계 & 채널 입점 가이드</h1>
          <p className="text-gray-400 text-sm">{cat.categoryName} 기준 패키징·배송 설계 및 유통 채널</p>
        </div>

        {/* 온도 민감성 경고 */}
        {logistics.coldChainRequired && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">🧊</span>
            <div>
              <p className="font-semibold text-blue-300">콜드체인 필수 제품</p>
              <p className="text-sm text-blue-200 mt-1">이 제품은 냉장·냉동 유통이 필수입니다. 아이스팩 + 보냉 포장 없이 일반 배송 불가.</p>
            </div>
          </div>
        )}

        {/* 패키징 가이드 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📦 패키징 & 배송 설계</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            {logistics.packagingGuide.map((guide, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-orange-500 font-mono text-sm flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm text-gray-300">{guide}</p>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500">📅 유통기한 안내: <span className="text-gray-300">{logistics.shelfLifeNote}</span></p>
            </div>
          </div>
        </div>

        {/* 채널 가이드 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">🏪 유통 채널 입점 가이드</h2>
          <div className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{ch.name}</span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{ch.type}</span>
                  </div>
                  {ch.url && (
                    <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:text-orange-300 flex-shrink-0">입점 신청 →</a>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">입점 조건: </span><span className="text-gray-300">{ch.entryCondition}</span></div>
                  <div><span className="text-gray-500">수수료: </span><span className="text-gray-300">{ch.fee}</span></div>
                  <div><span className="text-gray-500">강점: </span><span className="text-gray-300">{ch.strength}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={goReport} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-4 rounded-xl transition text-lg">
          📋 최종 리포트 생성 →
        </button>
      </div>
    </main>
  );
}

export default function LogisticsPage() {
  return <Suspense><LogisticsPageInner /></Suspense>;
}

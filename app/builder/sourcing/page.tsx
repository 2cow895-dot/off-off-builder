"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { TriageResult } from "@/types";

// 카테고리별 원자재 공급처 및 예산 기본값
const SOURCING_DATA: Record<string, {
  suppliers: { name: string; url: string; desc: string; grade: string }[];
  fixedCost: number;
  variableCostPerUnit: number;
  fixedCostDesc: string;
  variableDesc: string;
}> = {
  FOOD_MANUFACTURING: {
    suppliers: [
      { name: "오뚜기 B2B 식자재몰", url: "https://www.ottogi.co.kr", desc: "식용 등급 원료 대량 구매", grade: "식용(Food Grade)" },
      { name: "한국식품산업연구원 원료DB", url: "https://www.kifr.re.kr", desc: "허용 원료 목록 조회", grade: "공인 DB" },
      { name: "CJ온마트 B2B", url: "https://www.cjonmart.net", desc: "식용 버터·유제품 업소용", grade: "식용(Food Grade)" },
      { name: "이마트 트레이더스 기업회원", url: "https://traders.emart.com", desc: "소규모 식재료 소싱", grade: "식용(Food Grade)" },
    ],
    fixedCost: 200000,
    variableCostPerUnit: 3500,
    fixedCostDesc: "공유주방 이용료(시간당 2만원 × 10시간)",
    variableDesc: "버터·허브·심지·용기 등 원재료비 (100개 기준)",
  },
  FOOD_INSTANT: {
    suppliers: [
      { name: "농협 하나로마트 B2B", url: "https://www.nonghyup.com", desc: "농산물 직거래 식재료", grade: "식용" },
      { name: "롯데 푸드마켓 기업", url: "https://www.lottemart.com", desc: "소량 식재료 구매", grade: "식용" },
    ],
    fixedCost: 50000,
    variableCostPerUnit: 2000,
    fixedCostDesc: "팝업·마켓 부스 임대료",
    variableDesc: "원재료비",
  },
  FOOD_SERVICE_CAFE: {
    suppliers: [
      { name: "카페 드림 B2B", url: "https://www.cafedream.co.kr", desc: "원두·시럽·부자재 업소용", grade: "식용" },
      { name: "에스프레소코리아", url: "https://www.espressokorea.com", desc: "커피 원두 B2B", grade: "식용" },
    ],
    fixedCost: 5000000,
    variableCostPerUnit: 800,
    fixedCostDesc: "인테리어·장비 초기 투자 (간이 추정)",
    variableDesc: "음료 1잔당 원재료비",
  },
  FOOD_SERVICE_RESTAURANT: {
    suppliers: [
      { name: "마켓컬리 B2B", url: "https://biz.kurly.com", desc: "신선 식재료 B2B", grade: "식용" },
      { name: "식자재왕", url: "https://www.foodking.co.kr", desc: "업소용 식자재 전문", grade: "식용" },
    ],
    fixedCost: 3000000,
    variableCostPerUnit: 3000,
    fixedCostDesc: "주방 장비·인테리어 초기비용",
    variableDesc: "1인분당 식재료비",
  },
  HEALTH_FOOD: {
    suppliers: [
      { name: "코스맥스NBT 원료", url: "https://www.cosmax.com", desc: "기능성 원료 B2B (OEM 가능)", grade: "건강기능식품 기준" },
      { name: "한국인삼공사 원료", url: "https://www.kgcbyun.co.kr", desc: "홍삼·인삼 원료 공급", grade: "식약처 인정 원료" },
    ],
    fixedCost: 500000,
    variableCostPerUnit: 8000,
    fixedCostDesc: "GMP 시설 이용료 또는 OEM 최소 주문 비용",
    variableDesc: "기능성 원료·캡슐·포장재",
  },
  LIVESTOCK_PROCESSING: {
    suppliers: [
      { name: "축산물품질평가원", url: "https://www.ekape.or.kr", desc: "축산물 원료 등급 정보", grade: "축산물위생관리법 기준" },
      { name: "롯데 푸드 B2B", url: "https://www.lottefood.com", desc: "육가공 원료 공급", grade: "HACCP 인증" },
    ],
    fixedCost: 1000000,
    variableCostPerUnit: 5000,
    fixedCostDesc: "HACCP 시설 이용료",
    variableDesc: "원육·양념·포장재",
  },
  COSMETICS_MANUFACTURE: {
    suppliers: [
      { name: "씨앤씨인터내셔날 (원료)", url: "https://www.cnci.co.kr", desc: "화장품 원료 B2B", grade: "화장품 등급" },
      { name: "삼전화학 (원료)", url: "https://www.samjeon.com", desc: "기초 화장품 원료", grade: "화장품 등급" },
      { name: "인터파크 뷰티B2B", url: "https://biz.interpark.com", desc: "소규모 원료 구매", grade: "화장품 등급" },
    ],
    fixedCost: 300000,
    variableCostPerUnit: 4000,
    fixedCostDesc: "GMP 위탁 제조 최소 수량 기준 고정비",
    variableDesc: "원료·용기·포장재 (100개 기준)",
  },
  COSMETICS_CUSTOM: {
    suppliers: [
      { name: "씨앤씨인터내셔날", url: "https://www.cnci.co.kr", desc: "맞춤형화장품 원료", grade: "화장품 등급" },
    ],
    fixedCost: 100000,
    variableCostPerUnit: 6000,
    fixedCostDesc: "조제 공간·도구 초기 비용",
    variableDesc: "원료·용기",
  },
  QUASI_DRUG: {
    suppliers: [
      { name: "한국콜마 OEM", url: "https://www.kolmar.co.kr", desc: "의약외품 OEM 제조", grade: "GMP 기준" },
    ],
    fixedCost: 2000000,
    variableCostPerUnit: 1500,
    fixedCostDesc: "OEM 최소 주문량 기준 고정비",
    variableDesc: "원료·포장",
  },
  TEXTILE_APPAREL: {
    suppliers: [
      { name: "동대문 원단 도매 (패브릭타운)", url: "https://www.fabrictown.co.kr", desc: "원단·부자재 도매", grade: "섬유 안전기준 적합" },
      { name: "코오롱 FnC 원단 B2B", url: "https://www.kolonmall.com", desc: "고품질 섬유 원단", grade: "KS 기준" },
      { name: "에코앤드림 (친환경 원단)", url: "https://www.ecoanddream.com", desc: "유기농 면·친환경 원단", grade: "GOTS 인증" },
    ],
    fixedCost: 80000,
    variableCostPerUnit: 6000,
    fixedCostDesc: "재봉틀·작업 공간 (자택 가능)",
    variableDesc: "원단·실·라벨·부자재 (앞치마 1개 기준)",
  },
  CHILDREN_PRODUCT: {
    suppliers: [
      { name: "한국제품안전관리원 시험 의뢰", url: "https://www.kps.or.kr", desc: "KC 시험성적서 발급", grade: "어린이제품 안전기준" },
      { name: "동대문 어린이 원단 전문", url: "https://www.fabrictown.co.kr", desc: "아조염료 무함유 원단", grade: "어린이 안전기준" },
    ],
    fixedCost: 150000,
    variableCostPerUnit: 8000,
    fixedCostDesc: "KC 시험 비용 (1회 기준 분할)",
    variableDesc: "원단·부자재·KC 인증 비용 분담",
  },
  LEATHER_GOODS: {
    suppliers: [
      { name: "동대문 가죽 도매상가", url: "https://www.ddm.co.kr", desc: "천연·인조 가죽 원단 도매", grade: "크롬(VI) 기준 적합" },
      { name: "이태리 수입 가죽 (가죽나라)", url: "https://www.leatherland.co.kr", desc: "프리미엄 수입 가죽", grade: "수입 안전 기준" },
    ],
    fixedCost: 200000,
    variableCostPerUnit: 15000,
    fixedCostDesc: "가죽 공예 도구·작업대",
    variableDesc: "가죽 원단·실·금속 부자재",
  },
  CHEMICAL_PRODUCT: {
    suppliers: [
      { name: "삼성화학 (향료·왁스)", url: "https://www.samsungchem.co.kr", desc: "캔들 왁스·향료 B2B", grade: "화학제품안전법 적합" },
      { name: "칸데오 코리아 (캔들 원료)", url: "https://www.candeo.co.kr", desc: "캔들 전문 원료 공급사", grade: "안전확인신고 원료" },
      { name: "한국향료협회 DB", url: "https://www.kfma.or.kr", desc: "허용 향료 목록 조회", grade: "공인 DB" },
    ],
    fixedCost: 150000,
    variableCostPerUnit: 2500,
    fixedCostDesc: "생활화학제품 안전확인신고 비용 (1회)",
    variableDesc: "왁스·향료·심지·용기 (100개 기준)",
  },
  FURNITURE_INTERIOR: {
    suppliers: [
      { name: "한국목재공업협동조합", url: "https://www.kwfia.or.kr", desc: "E0·E1 등급 목재 공급", grade: "E1 이하 (실내 기준)" },
      { name: "이케아 비즈니스", url: "https://www.ikea.com/kr/ko/business", desc: "소규모 목재·부자재", grade: "EU 기준" },
    ],
    fixedCost: 500000,
    variableCostPerUnit: 30000,
    fixedCostDesc: "목공 장비·작업 공간",
    variableDesc: "목재·철물·도료 (단품 기준)",
  },
  ELECTRICAL_GOODS: {
    suppliers: [
      { name: "KTL 한국산업기술시험원", url: "https://www.ktl.re.kr", desc: "KC 인증 시험 의뢰", grade: "KC 인증 기준" },
      { name: "알리바바 B2B (OEM)", url: "https://www.alibaba.com", desc: "전기 부품 수입 소싱", grade: "수입 KC 인증 필요" },
    ],
    fixedCost: 2000000,
    variableCostPerUnit: 8000,
    fixedCostDesc: "KC 인증 비용 (1회, 품목당)",
    variableDesc: "부품·조립·포장",
  },
  PLANT_FLOWER: {
    suppliers: [
      { name: "양재 화훼공판장", url: "https://www.aT.or.kr", desc: "화훼 경매·도매", grade: "식물방역 통과" },
      { name: "고양 화훼단지", url: "https://www.goyangflower.com", desc: "관엽식물 도매", grade: "검역 적합" },
    ],
    fixedCost: 100000,
    variableCostPerUnit: 3000,
    fixedCostDesc: "화분·흙·작업 도구",
    variableDesc: "식물 원가·화분·포장재",
  },
  ORGANIC_AGRI: {
    suppliers: [
      { name: "친환경유통센터 (aT)", url: "https://www.at.or.kr", desc: "유기농 인증 농산물 B2B", grade: "유기농 인증" },
      { name: "농업회사법인 직거래", url: "https://www.farmerin.kr", desc: "농가 직거래 플랫폼", grade: "GAP 또는 유기 인증" },
    ],
    fixedCost: 200000,
    variableCostPerUnit: 4000,
    fixedCostDesc: "가공 설비·포장재",
    variableDesc: "유기농 원재료·포장",
  },
  PET_FOOD: {
    suppliers: [
      { name: "하림 펫푸드 원료", url: "https://www.harim.com", desc: "닭고기 등 펫푸드 원료", grade: "사료관리법 기준" },
      { name: "대한사료 원료몰", url: "https://www.daehan.co.kr", desc: "사료 원료 B2B", grade: "사료 공정서 기준" },
    ],
    fixedCost: 300000,
    variableCostPerUnit: 2000,
    fixedCostDesc: "사료제조업 등록 및 시설 비용",
    variableDesc: "닭고기·고구마·오트밀 등 원료",
  },
  PET_GOODS: {
    suppliers: [
      { name: "도매꾹 반려동물 원단", url: "https://www.domeggook.com", desc: "펫 의류·용품 원단 도매", grade: "일반 안전기준" },
      { name: "알리익스프레스 B2B", url: "https://www.aliexpress.com", desc: "펫 부자재 소싱", grade: "자체 검수 필요" },
    ],
    fixedCost: 100000,
    variableCostPerUnit: 5000,
    fixedCostDesc: "재봉틀·도구",
    variableDesc: "원단·부자재",
  },
  CLASS_STUDIO: {
    suppliers: [
      { name: "예스아트 공예 재료", url: "https://www.yesart.co.kr", desc: "공방 재료 도매", grade: "일반" },
      { name: "공방 재료 도매몰", url: "https://www.craftmall.kr", desc: "원데이클래스 재료 소싱", grade: "일반" },
    ],
    fixedCost: 500000,
    variableCostPerUnit: 15000,
    fixedCostDesc: "공방 임대·장비",
    variableDesc: "수업 1인당 재료비",
  },
};

const SPECIAL_SOURCING_ROUTES = [
  {
    icon: "✈️",
    title: "해외 직수입 (생산지 직거래)",
    badge: "가장 저렴",
    desc: "생산국 농장·제조사와 직접 계약해 수입. 단가 최저지만 MOQ(최소 주문량)와 통관 절차가 필요합니다.",
    steps: [
      "해외 생산자 발굴: Alibaba / Global Sources / 해당 국가 무역관",
      "샘플 주문 → 품질 확인 (국내 성분 분석 기관 의뢰 권장)",
      "수입신고: 관세사 선임 (비용 약 15~30만원/건)",
      "식품의 경우 수입식품안전관리 특별법 기준 서류 준비",
      "식약처 수입식품 신고 → 통관 후 판매",
    ],
    links: [
      { label: "Alibaba 글로벌 B2B", url: "https://www.alibaba.com" },
      { label: "KOTRA 해외시장 정보", url: "https://www.kotra.or.kr" },
      { label: "식약처 수입식품 신고", url: "https://www.foodsafetykorea.go.kr" },
    ],
    warning: "식품 직수입 시 '수입식품안전관리 특별법'에 따라 수입업 신고 또는 등록이 필요할 수 있습니다.",
  },
  {
    icon: "🏢",
    title: "국내 수입 무역상사 활용",
    badge: "가장 간편",
    desc: "이미 국내 통관을 완료한 수입 무역상사에서 구매. 수량이 적어도 가능하며 서류 부담이 없습니다.",
    steps: [
      "한국무역협회(KITA) 또는 네이버 B2B 무역에서 전문 수입상 검색",
      "관심 품목의 식품 수입업체 목록 요청",
      "단가·MOQ 협상 후 거래명세서·성적서(COA) 수령",
      "별도 수입신고 없이 국내 거래로 처리 가능",
    ],
    links: [
      { label: "한국무역협회(KITA)", url: "https://www.kita.net" },
      { label: "트레이드코리아", url: "https://www.tradekorea.com" },
    ],
  },
  {
    icon: "🗺️",
    title: "국내 특산물·소규모 수입상 발굴",
    badge: "희귀 원재료",
    desc: "오페퍼(희귀 후추), 마켓컬리 B2B, 농협 특산물 등 소규모 특수 원재료 전문 공급처를 활용합니다.",
    steps: [
      "네이버 스마트스토어 / 인스타그램에서 '#수입후추 #희귀향신료' 등 검색 → 소규모 수입상 발굴",
      "스페셜티 식재료 전문 플랫폼(마켓컬리 B2B, 쿠팡 비즈) 문의",
      "거래 시 공급업체 사업자등록증·원산지증명서 반드시 수령",
      "소량 매입 후 반응 확인 → 수요 입증 후 직수입 전환 고려",
    ],
    links: [
      { label: "마켓컬리 B2B", url: "https://biz.kurly.com" },
      { label: "쿠팡 비즈니스", url: "https://biz.coupang.com" },
    ],
  },
  {
    icon: "📋",
    title: "수입 시 필수 행정 체크",
    desc: "식품·향신료 등을 수입하거나 수입 원재료를 사용해 제품을 만들 때 반드시 확인해야 할 항목입니다.",
    steps: [
      "원산지 표시 의무: '원산지: ○○국' 라벨 부착 (대외무역법)",
      "수입 식품 성분 분석표(COA) 보관 — 식약처 점검 시 제출",
      "관세율 확인: 관세법령정보포털(CusNet)에서 HS코드 검색",
      "수입 통관 후 국내 기준 초과 성분 여부 재확인 필수",
    ],
    links: [
      { label: "관세법령정보포털", url: "https://www.customs.go.kr" },
      { label: "HS코드 조회", url: "https://unipass.customs.go.kr" },
    ],
    warning: "수입 원재료라도 국내 식품위생법·화장품법 기준을 충족해야 합니다. 해외 인증이 국내 기준과 다를 수 있습니다.",
  },
];

const DEFAULT_SOURCING = {
  suppliers: [{ name: "도매꾹", url: "https://www.domeggook.com", desc: "국내 최대 도매 플랫폼", grade: "일반" }],
  fixedCost: 200000,
  variableCostPerUnit: 5000,
  fixedCostDesc: "기본 인프라 비용",
  variableDesc: "단위당 원재료비",
};

// 수입/희귀/특수 원재료 키워드
const IMPORT_KEYWORDS = [
  "수입", "희귀", "특수", "이국", "해외", "외국", "원산지", "직수입", "후추", "향신료", "스파이스",
  "트러플", "사프란", "바닐라", "마카", "아사이", "슈퍼푸드", "유기농 수입", "원두 수입", "허브 수입",
];

function detectSpecialSourcing(rawText: string): boolean {
  const text = rawText.toLowerCase();
  return IMPORT_KEYWORDS.some(k => text.includes(k));
}

function SourcingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [margin, setMargin] = useState(40);
  const [rawText, setRawText] = useState("");
  const [businessMethod, setBusinessMethodState] = useState<string>("");

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    if (!session.paid) { router.push(`/builder/paywall?session=${sessionId}`); return; }
    setTriage(session.triage);
    setRawText(session.rawText ?? "");
    setBusinessMethodState(session.businessInfo?.businessMethod ?? "self_manufacture");
    if (session.detectedQuantity) setQuantity(session.detectedQuantity);
  }, [sessionId, router]);

  if (!triage) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">불러오는 중...</div>;

  const cat = triage.matchedCategory;
  const sourcing = SOURCING_DATA[cat.categoryId] || DEFAULT_SOURCING;
  const isSpecial = detectSpecialSourcing(rawText) || businessMethod === "import_resell";
  const isOEM = businessMethod === "oem";
  const isPopup = businessMethod === "popup";

  const totalVariable = sourcing.variableCostPerUnit * quantity;
  const totalCost = sourcing.fixedCost + totalVariable;
  const costPerUnit = Math.ceil(totalCost / quantity);
  const retailPrice = Math.ceil(costPerUnit / (1 - margin / 100) / 100) * 100;

  function goNext() {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (!stored) return;
    const session = JSON.parse(stored);
    session.currentStep = 4;
    session.budget = { fixedCost: sourcing.fixedCost, variableCostPerUnit: sourcing.variableCostPerUnit, quantity, totalCost, recommendedRetailPrice: retailPrice };
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    router.push(`/builder/qc?session=${sessionId}`);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/builder/licensing?session=${sessionId}`)}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
            ← 뒤로
          </button>
          <span className="text-gray-700">|</span>
          <span className="text-xl font-bold">오프오프 빌더</span>
        </div>
        <div className="flex gap-2 text-xs text-gray-500">
          {["법적 타당성", "인허가·서류", "소싱·예산", "안전·라벨", "물류·채널"].map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded ${i === 2 ? "bg-orange-500 text-white" : "bg-gray-800"}`}>{i + 1}. {s}</span>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">소싱 & 예산 계산기</h1>
          <p className="text-gray-400 text-sm">{cat.categoryName} 기준 B2B 공급처 및 초기 예산 산출</p>
        </div>

        {/* 수량 슬라이더 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">📦 목표 생산 수량</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">생산 수량</span>
              <span className="text-orange-400 font-bold text-lg">{quantity.toLocaleString()}개</span>
            </div>
            <input type="range" min={10} max={1000} step={10} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
              className="w-full accent-orange-500" />
            <div className="flex justify-between text-xs text-gray-500"><span>10개</span><span>1,000개</span></div>
          </div>
        </div>

        {/* 예산 브레이크다운 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">💰 초기 예산 계산</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-start py-3 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium">고정비 (인프라)</p>
                <p className="text-xs text-gray-500">{sourcing.fixedCostDesc}</p>
              </div>
              <span className="text-white font-mono">{sourcing.fixedCost.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-start py-3 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium">변동비 (원재료)</p>
                <p className="text-xs text-gray-500">{sourcing.variableDesc} × {quantity}개</p>
              </div>
              <span className="text-white font-mono">{totalVariable.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <p className="font-bold">총 초기 투자 비용</p>
              <span className="text-orange-400 font-bold font-mono text-lg">{totalCost.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <p className="text-sm">개당 원가</p>
              <span className="text-white font-mono">{costPerUnit.toLocaleString()}원</span>
            </div>
          </div>

          {/* 마진율 슬라이더 */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">목표 마진율</span>
              <span className="text-green-400 font-bold">{margin}%</span>
            </div>
            <input type="range" min={10} max={80} step={5} value={margin} onChange={e => setMargin(Number(e.target.value))}
              className="w-full accent-green-500" />
          </div>

          <div className="bg-green-950 border border-green-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">💡 권장 소비자가</p>
              <span className="text-green-400 font-bold font-mono text-xl">{retailPrice.toLocaleString()}원</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">원가 {costPerUnit.toLocaleString()}원 × (1 + {margin}%) 기준</p>
          </div>
        </div>

        {/* B2B 공급처 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">🏬 법적 안전 등급 B2B 공급처</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sourcing.suppliers.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 space-y-2 transition block">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{s.name}</p>
                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded flex-shrink-0">{s.grade}</span>
                </div>
                <p className="text-xs text-gray-400">{s.desc}</p>
                <p className="text-xs text-orange-400">바로가기 →</p>
              </a>
            ))}
          </div>
        </div>

        {/* 특수·수입 원재료 소싱 가이드 */}
        {isSpecial && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">🌏 특수·수입 원재료 소싱 경로</h2>
              <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">수입 감지</span>
            </div>
            <div className="bg-purple-950 border border-purple-800 rounded-xl p-5 space-y-2">
              <p className="text-sm text-purple-200 font-medium">아이디어에서 희귀·수입 원재료가 감지되었습니다.</p>
              <p className="text-xs text-purple-300">국내 일반 B2B 공급처 외에 아래 경로를 통해 특수 원재료를 합법적으로 조달할 수 있습니다.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {SPECIAL_SOURCING_ROUTES.map((route) => (
                <div key={route.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{route.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{route.title}</p>
                        {route.badge && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{route.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{route.desc}</p>
                    </div>
                  </div>
                  {route.steps && (
                    <ol className="space-y-1 pl-2">
                      {route.steps.map((step, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-orange-500 font-mono flex-shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {route.links && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {route.links.map(link => (
                        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-orange-400 hover:text-orange-300 underline">
                          {link.label} →
                        </a>
                      ))}
                    </div>
                  )}
                  {route.warning && (
                    <p className="text-xs text-yellow-400 bg-yellow-950 border border-yellow-800 rounded px-3 py-2">
                      ⚠️ {route.warning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OEM 공장 소싱 가이드 */}
        {isOEM && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">🏭 OEM 제조사 발굴 가이드</h2>
              <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">OEM 방식</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  icon: "🔍", title: "OEM 공장 찾기",
                  steps: ["공장나라(factorykorea.com) — 국내 제조사 DB 검색", "네이버 B2B 마켓에서 품목명 + 'OEM' 검색", "한국제조업협회 회원사 목록 활용", "Alibaba — 해외 OEM 공장 (MOQ 낮음)"],
                  links: [{ label: "공장나라", url: "https://www.factorykorea.com" }, { label: "Alibaba OEM", url: "https://www.alibaba.com" }],
                },
                {
                  icon: "📋", title: "OEM 계약 시 체크리스트",
                  steps: ["제품 사양서(스펙시트) 먼저 작성 후 공장 제출", "샘플 3회 이상 수령 → 품질 확정", "제조물책임(PL) 책임 주체 계약서에 명시", "로트(Lot)번호 관리 및 이력 추적 가능 공장 선택", "납기·불량률·재작업 조건 계약서 포함"],
                },
                {
                  icon: "🏷️", title: "자체 브랜드 라벨링",
                  steps: ["상표 출원 먼저 (특허청 키프리스)", "OEM 공장에 브랜드 라벨 인쇄 요청 또는 별도 라벨 부착", "해당 법령 의무 표기사항 반드시 포함"],
                  links: [{ label: "키프리스 상표 출원", url: "https://www.kipris.or.kr" }],
                },
              ].map(route => (
                <div key={route.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{route.icon}</span>
                    <p className="font-semibold text-sm">{route.title}</p>
                  </div>
                  <ol className="space-y-1 pl-2">
                    {route.steps.map((step, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2">
                        <span className="text-purple-400 font-mono flex-shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {"links" in route && route.links && (
                    <div className="flex flex-wrap gap-2">
                      {route.links.map(link => (
                        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-orange-400 hover:text-orange-300 underline">{link.label} →</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 팝업 소싱 가이드 */}
        {isPopup && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">🎪 팝업 장소 & 소싱 가이드</h2>
              <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">팝업 방식</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  icon: "📍", title: "팝업 장소 찾기",
                  steps: ["스페이스클라우드 — 단기 공간 임대", "팝플리·위팝 — 팝업 전문 플랫폼", "백화점·쇼핑몰 MD 팀 직접 제안서 발송", "마켓 플리마켓(서울숲, 망원 등) 입점 신청"],
                  links: [{ label: "스페이스클라우드", url: "https://www.spacecloud.kr" }, { label: "팝플리", url: "https://www.popply.co.kr" }],
                },
                {
                  icon: "📦", title: "소량 소싱 전략",
                  steps: ["팝업은 소량이므로 도매꾹·오너클랜에서 소량 구매 가능", "테스트 판매 후 반응 확인 → 직수입 또는 OEM 전환", "재고 리스크 최소화: 선주문 방식 고려"],
                  links: [{ label: "도매꾹", url: "https://www.domeggook.com" }, { label: "오너클랜", url: "https://www.ownerclan.com" }],
                },
              ].map(route => (
                <div key={route.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{route.icon}</span>
                    <p className="font-semibold text-sm">{route.title}</p>
                  </div>
                  <ol className="space-y-1 pl-2">
                    {route.steps.map((step, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2">
                        <span className="text-yellow-400 font-mono flex-shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap gap-2">
                    {route.links.map(link => (
                      <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-orange-400 hover:text-orange-300 underline">{link.label} →</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={goNext} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-4 rounded-xl transition text-lg">
          STEP 4: 안전 검증 & 라벨 작성 →
        </button>
      </div>
    </main>
  );
}

export default function SourcingPage() {
  return <Suspense><SourcingPageInner /></Suspense>;
}

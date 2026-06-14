import categoriesData from "@/data/categories.json";
import type { OfflineCategory, IdeaInput, TriageResult, LegalStatus, IngredientRule } from "@/types";

const categories = categoriesData as OfflineCategory[];

// ─── 키워드 매칭 스코어 계산 ─────────────────────────────────────

function scoreCategory(rawText: string, category: OfflineCategory): number {
  const text = rawText.toLowerCase();
  let score = 0;

  for (const keyword of category.keywords) {
    if (text.includes(keyword.toLowerCase())) {
      // 정확히 일치할수록 가중치 높임
      score += keyword.length > 3 ? 2 : 1;
    }
  }

  return score;
}

// ─── 원료 위험 감지 ──────────────────────────────────────────────

function detectFlaggedIngredients(
  rawText: string,
  category: OfflineCategory
): IngredientRule[] {
  const text = rawText.toLowerCase();
  return category.prohibitedIngredients.filter((rule) =>
    text.includes(rule.ingredientName.split(" ")[0].toLowerCase())
  );
}

// ─── 법적 상태 판별 ──────────────────────────────────────────────

function determineLegalStatus(flagged: IngredientRule[]): LegalStatus {
  if (flagged.some((r) => r.ruleType === "PROHIBITED")) return "BLOCKED";
  if (flagged.some((r) => r.ruleType === "RESTRICTED" || r.ruleType === "REQUIRES_CERTIFICATION")) return "WARNING";
  return "CLEAR";
}

// ─── 메인 트리아지 함수 ──────────────────────────────────────────

export function runTriage(input: IdeaInput): TriageResult {
  // 1. 전체 카테고리 스코어링
  const scored = categories
    .map((cat) => ({ category: cat, score: scoreCategory(input.rawText, cat) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // 2. 매칭 카테고리 없음 → fallback
  if (scored.length === 0) {
    return {
      sessionId: input.sessionId,
      legalStatus: "WARNING",
      matchedCategory: categories[0], // 식품제조 기본값
      matchScore: 0,
      flaggedIngredients: [],
      alternativeSuggestion:
        "아이디어를 더 구체적으로 입력해 주세요. (예: 어떤 제품인지, 재료가 무엇인지)",
    };
  }

  const best = scored[0];
  const secondaryCategories =
    scored.length > 1 ? scored.slice(1, 3).map((s) => s.category) : undefined;

  // 3. 원료 위험 감지
  const flagged = detectFlaggedIngredients(input.rawText, best.category);

  // 4. 법적 상태 판별
  const legalStatus = determineLegalStatus(flagged);

  // 5. BLOCKED 시 우회안 수집
  const alternativeSuggestion =
    legalStatus === "BLOCKED"
      ? flagged
          .map((r) => r.alternativeSuggestion)
          .filter(Boolean)
          .join(" / ") || "해당 원료를 제거하거나 합법적 대체재 사용이 필요합니다."
      : undefined;

  return {
    sessionId: input.sessionId,
    legalStatus,
    matchedCategory: best.category,
    matchScore: best.score,
    flaggedIngredients: flagged,
    alternativeSuggestion,
    secondaryCategories,
    lawApiLastChecked: new Date().toISOString(),
  };
}

// ─── 카테고리 목록 조회 헬퍼 ────────────────────────────────────

export function getAllCategories(): OfflineCategory[] {
  return categories;
}

export function getCategoryById(id: string): OfflineCategory | undefined {
  return categories.find((c) => c.categoryId === id);
}

export function getCategoriesByIndustry(industryGroup: string): OfflineCategory[] {
  return categories.filter((c) => c.industryGroup === industryGroup);
}

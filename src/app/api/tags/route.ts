import { NextResponse } from "next/server";
import { getTagsPage } from "@/lib/data";

function normalizePage(value: string | null) {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { items, nextPage } = await getTagsPage({
    page: normalizePage(searchParams.get("page")),
    query: searchParams.get("q") ?? undefined
  });

  return NextResponse.json({
    items: items.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      questionCount: tag.questionCount,
      solvedQuestionCount: tag.solvedQuestionCount,
      unsolvedQuestionCount: tag.unsolvedQuestionCount
    })),
    nextPage
  });
}

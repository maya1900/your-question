import { NextResponse } from "next/server";
import { getQuestionsPage, type QuestionSort } from "@/lib/data";

function normalizeSort(value: string | null): QuestionSort {
  if (value === "latest" || value === "unsolved") return value;
  return "hot";
}

function normalizePage(value: string | null) {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = normalizePage(searchParams.get("page"));
  const { items, nextPage } = await getQuestionsPage({
    page,
    sort: normalizeSort(searchParams.get("sort")),
    tag: searchParams.get("tag") ?? undefined,
    query: searchParams.get("q") ?? undefined
  });

  return NextResponse.json({
    items: items.map((question) => ({
      id: question.id,
      title: question.title,
      body: question.body,
      views: question.views,
      acceptedAnswerId: question.acceptedAnswerId,
      createdAt: question.createdAt.toISOString(),
      author: question.author,
      tags: question.tags.map(({ tag }) => ({ tag })),
      voteCount: question.votes.length,
      answerCount: question.answers.length
    })),
    nextPage
  });
}

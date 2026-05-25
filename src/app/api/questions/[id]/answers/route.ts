import { NextResponse } from "next/server";
import { getQuestionAnswersPage } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function normalizePage(value: string | null) {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const [question, user] = await Promise.all([
    prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        acceptedAnswerId: true,
        hiddenAt: true,
        author: {
          select: {
            isActive: true
          }
        }
      }
    }),
    getCurrentUser()
  ]);

  if (!question || question.hiddenAt || !question.author.isActive) {
    return NextResponse.json({ items: [], nextPage: null }, { status: 404 });
  }

  const { items, nextPage } = await getQuestionAnswersPage({
    questionId: id,
    acceptedAnswerId: question.acceptedAnswerId,
    page: normalizePage(searchParams.get("page"))
  });

  return NextResponse.json({
    items: items.map((answer) => ({
      id: answer.id,
      summary: answer.summary,
      body: answer.body,
      authorId: answer.authorId,
      createdAt: answer.createdAt.toISOString(),
      author: answer.author,
      voteCount: answer.votes.length,
      voted: user ? answer.votes.some((vote) => vote.userId === user.id) : false,
      disabled: user?.id === answer.authorId,
      accepted: answer.id === question.acceptedAnswerId
    })),
    nextPage,
    canAccept: user?.id === question.authorId
  });
}

import { prisma } from "@/lib/prisma";
import { tagOptions } from "@/lib/constants";
import { slugifyTag } from "@/lib/format";

export type QuestionSort = "hot" | "latest" | "unsolved";
export type AdminUserStatus = "all" | "active" | "inactive";
export type AdminContentStatus = "all" | "visible" | "hidden";
export type AdminQuestionStatus = AdminContentStatus | "solved" | "unsolved";
export type AdminSort = "latest" | "oldest";

const adminPageSize = 12;

function boundedPage(page?: number) {
  if (!page || Number.isNaN(page) || page < 1) return 1;
  return Math.floor(page);
}

function pagination(page: number, total: number, pageSize = adminPageSize) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    pageCount,
    hasPrev: page > 1,
    hasNext: page < pageCount
  };
}

export async function getQuestions({
  sort = "hot",
  tag,
  query,
  limit = 50
}: {
  sort?: QuestionSort;
  tag?: string;
  query?: string;
  limit?: number;
}) {
  const trimmedQuery = query?.trim();
  const trimmedTag = tag?.trim();

  const questions = await prisma.question.findMany({
    where: {
      hiddenAt: null,
      author: {
        isActive: true
      },
      ...(trimmedQuery
        ? {
            OR: [
              { title: { contains: trimmedQuery } },
              { body: { contains: trimmedQuery } },
              { author: { name: { contains: trimmedQuery } } },
              { tags: { some: { tag: { name: { contains: trimmedQuery } } } } }
            ]
          }
        : {}),
      ...(trimmedTag && trimmedTag !== "all"
        ? {
            tags: {
              some: {
                tag: {
                  slug: trimmedTag
                }
              }
            }
          }
        : {}),
      ...(sort === "unsolved" ? { acceptedAnswerId: null } : {})
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          score: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      },
      _count: {
        select: {
          votes: true,
          answers: true
        }
      },
      acceptedAnswer: {
        select: {
          id: true
        }
      }
    },
    orderBy: sort === "latest" ? { createdAt: "desc" } : { createdAt: "desc" },
    take: limit
  });

  // 手动添加 votes 和 answers 数组以保持兼容性
  const questionsWithCounts = questions.map(q => ({
    ...q,
    votes: Array(q._count.votes).fill({}),
    answers: Array(q._count.answers).fill({})
  }));

  if (sort === "hot") {
    return questionsWithCounts.sort((a, b) => hotScore(b) - hotScore(a));
  }

  return questionsWithCounts;
}

export async function getQuestionById(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: {
      author: true,
      tags: {
        include: {
          tag: true
        }
      },
      votes: true,
      acceptedAnswer: true,
      answers: {
        where: {
          hiddenAt: null,
          author: {
            isActive: true
          }
        },
        include: {
          author: true,
          votes: true
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function getTags() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          questions: true
        }
      },
      questions: {
        where: {
          question: {
            hiddenAt: null,
            author: {
              isActive: true
            }
          }
        },
        include: {
          question: true
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return tags.sort((a, b) => b._count.questions - a._count.questions);
}

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      questions: {
        where: { hiddenAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              answers: true,
              votes: true
            }
          }
        }
      },
      answers: {
        where: { hiddenAt: null, question: { hiddenAt: null } },
        orderBy: { createdAt: "desc" },
        include: {
          question: {
            select: {
              id: true,
              title: true
            }
          },
          _count: {
            select: {
              votes: true
            }
          }
        }
      },
      scoreEvents: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          question: true,
          answer: {
            include: {
              question: true
            }
          }
        }
      }
    }
  });
}

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      name: true,
      email: false,
      score: true,
      createdAt: true,
      questions: {
        where: { hiddenAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              answers: true,
              votes: true
            }
          }
        }
      },
      answers: {
        where: { hiddenAt: null, question: { hiddenAt: null } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          question: {
            select: {
              id: true,
              title: true
            }
          },
          _count: {
            select: {
              votes: true
            }
          }
        }
      },
      _count: {
        select: {
          questions: true,
          answers: true
        }
      }
    }
  });
}

export async function getLeaderboard() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { score: "desc" },
    take: 5
  });
}

export async function getAdminDashboard() {
  const [
    userCount,
    questionCount,
    answerCount,
    tagCount,
    voteCount,
    solvedQuestionCount,
    scoreEventCount,
    recentUsers,
    recentQuestions,
    recentAnswers,
    recentScoreEvents
  ] = await Promise.all([
    prisma.user.count(),
    prisma.question.count(),
    prisma.answer.count(),
    prisma.tag.count(),
    prisma.vote.count(),
    prisma.question.count({ where: { acceptedAnswerId: { not: null } } }),
    prisma.scoreEvent.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        score: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            answers: true,
            votes: true
          }
        }
      }
    }),
    prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        author: true,
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            answers: true,
            votes: true
          }
        }
      }
    }),
    prisma.answer.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        author: true,
        question: true,
        _count: {
          select: {
            votes: true
          }
        }
      }
    }),
    prisma.scoreEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: true,
        actor: true,
        question: true,
        answer: {
          include: {
            question: true
          }
        }
      }
    })
  ]);

  return {
    stats: {
      userCount,
      questionCount,
      answerCount,
      tagCount,
      voteCount,
      solvedQuestionCount,
      scoreEventCount
    },
    recentUsers,
    recentQuestions,
    recentAnswers,
    recentScoreEvents
  };
}

export async function getAdminUsers({
  query,
  status = "all",
  page = 1
}: {
  query?: string;
  status?: AdminUserStatus;
  page?: number;
}) {
  const currentPage = boundedPage(page);
  const trimmedQuery = query?.trim();
  const where = {
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { name: { contains: trimmedQuery } },
            { email: { contains: trimmedQuery.toLowerCase() } }
          ]
        }
      : {})
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * adminPageSize,
      take: adminPageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        score: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true,
            answers: true,
            votes: true,
            sessions: true
          }
        }
      }
    })
  ]);

  return { users, pagination: pagination(currentPage, total) };
}

export async function getAdminUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          _count: {
            select: {
              answers: true,
              votes: true
            }
          }
        }
      },
      answers: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          question: {
            select: {
              id: true,
              title: true
            }
          },
          _count: {
            select: {
              votes: true
            }
          }
        }
      },
      scoreEvents: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          actor: true,
          question: true,
          answer: {
            include: {
              question: true
            }
          }
        }
      },
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 5
      },
      _count: {
        select: {
          questions: true,
          answers: true,
          votes: true,
          scoreEvents: true,
          sessions: true
        }
      }
    }
  });
}

export async function getAdminQuestions({
  query,
  status = "all",
  tag,
  sort = "latest",
  page = 1
}: {
  query?: string;
  status?: AdminQuestionStatus;
  tag?: string;
  sort?: AdminSort;
  page?: number;
}) {
  const currentPage = boundedPage(page);
  const trimmedQuery = query?.trim();
  const trimmedTag = tag?.trim();
  const where = {
    ...(status === "visible" ? { hiddenAt: null } : {}),
    ...(status === "hidden" ? { hiddenAt: { not: null } } : {}),
    ...(status === "solved" ? { acceptedAnswerId: { not: null } } : {}),
    ...(status === "unsolved" ? { acceptedAnswerId: null } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { title: { contains: trimmedQuery } },
            { body: { contains: trimmedQuery } },
            { author: { name: { contains: trimmedQuery } } },
            { author: { email: { contains: trimmedQuery.toLowerCase() } } }
          ]
        }
      : {}),
    ...(trimmedTag && trimmedTag !== "all"
      ? {
          tags: {
            some: {
              tag: {
                slug: trimmedTag
              }
            }
          }
        }
      : {})
  };

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (currentPage - 1) * adminPageSize,
      take: adminPageSize,
      include: {
        author: true,
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            answers: true,
            votes: true
          }
        }
      }
    })
  ]);

  return { questions, pagination: pagination(currentPage, total) };
}

export async function getAdminAnswers({
  query,
  status = "all",
  sort = "latest",
  page = 1
}: {
  query?: string;
  status?: AdminContentStatus;
  sort?: AdminSort;
  page?: number;
}) {
  const currentPage = boundedPage(page);
  const trimmedQuery = query?.trim();
  const where = {
    ...(status === "visible" ? { hiddenAt: null } : {}),
    ...(status === "hidden" ? { hiddenAt: { not: null } } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { summary: { contains: trimmedQuery } },
            { body: { contains: trimmedQuery } },
            { author: { name: { contains: trimmedQuery } } },
            { author: { email: { contains: trimmedQuery.toLowerCase() } } },
            { question: { title: { contains: trimmedQuery } } }
          ]
        }
      : {})
  };

  const [total, answers] = await Promise.all([
    prisma.answer.count({ where }),
    prisma.answer.findMany({
      where,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (currentPage - 1) * adminPageSize,
      take: adminPageSize,
      include: {
        author: true,
        question: {
          select: {
            id: true,
            title: true,
            acceptedAnswerId: true,
            hiddenAt: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      }
    })
  ]);

  return { answers, pagination: pagination(currentPage, total) };
}

export async function getAdminTags({
  query,
  page = 1
}: {
  query?: string;
  page?: number;
}) {
  const currentPage = boundedPage(page);
  const trimmedQuery = query?.trim();
  const where = {
    ...(trimmedQuery
      ? {
          OR: [
            { name: { contains: trimmedQuery } },
            { slug: { contains: trimmedQuery.toLowerCase() } }
          ]
        }
      : {})
  };

  const [total, tags] = await Promise.all([
    prisma.tag.count({ where }),
    prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (currentPage - 1) * adminPageSize,
      take: adminPageSize,
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                acceptedAnswerId: true,
                hiddenAt: true,
                author: {
                  select: {
                    isActive: true
                  }
                }
              }
            }
          }
        }
      }
    })
  ]);

  const tagSummaries = tags.map((tag) => {
    const visibleQuestions = tag.questions.filter(
      ({ question }) => !question.hiddenAt && question.author.isActive
    );
    return {
      ...tag,
      questionCount: tag.questions.length,
      visibleQuestionCount: visibleQuestions.length,
      solvedQuestionCount: visibleQuestions.filter(({ question }) => question.acceptedAnswerId).length,
      hiddenQuestionCount: tag.questions.filter(({ question }) => question.hiddenAt).length
    };
  });

  return { tags: tagSummaries, pagination: pagination(currentPage, total) };
}

export async function getQuestionStats() {
  const [questionCount, answerCount, unsolvedCount, tagCount] = await Promise.all([
    prisma.question.count({ where: { hiddenAt: null, author: { isActive: true } } }),
    prisma.answer.count({ where: { hiddenAt: null, author: { isActive: true }, question: { hiddenAt: null } } }),
    prisma.question.count({ where: { acceptedAnswerId: null, hiddenAt: null, author: { isActive: true } } }),
    prisma.tag.count()
  ]);

  return {
    questionCount,
    answerCount,
    unsolvedCount,
    tagCount
  };
}

export async function getRelatedQuestions(questionId: string, tagSlugs: string[]) {
  if (!tagSlugs.length) return [];

  return prisma.question.findMany({
    where: {
      id: { not: questionId },
      hiddenAt: null,
      author: {
        isActive: true
      },
      tags: {
        some: {
          tag: {
            slug: {
              in: tagSlugs
            }
          }
        }
      }
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    },
    take: 4,
    orderBy: { createdAt: "desc" }
  });
}

export function normalizeTags(input: string) {
  const names = input
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  const unique = new Map<string, { name: string; slug: string }>();
  for (const name of names) {
    const slug = slugifyTag(name);
    if (!unique.has(slug)) {
      unique.set(slug, { name, slug });
    }
  }

  return Array.from(unique.values());
}

export function defaultTagFilters() {
  return [{ label: "全部", slug: "all" }, ...tagOptions];
}

export function hotScore(question: {
  views: number;
  votes: unknown[];
  answers: unknown[];
}) {
  return question.votes.length * 3 + question.answers.length * 5 + question.views * 0.1;
}

export async function getCheckInStatus(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayCheckIn = await prisma.checkIn.findFirst({
    where: {
      userId,
      checkInDate: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayCheckIn = await prisma.checkIn.findFirst({
    where: {
      userId,
      checkInDate: {
        gte: yesterday,
        lt: today
      }
    }
  });

  return {
    hasCheckedInToday: !!todayCheckIn,
    continuousDays: todayCheckIn?.continuousDays ?? (yesterdayCheckIn?.continuousDays ?? 0),
    todayPoints: todayCheckIn?.points ?? 0
  };
}

export async function getCheckInHistory(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return prisma.checkIn.findMany({
    where: {
      userId,
      checkInDate: {
        gte: startDate
      }
    },
    orderBy: { checkInDate: "desc" }
  });
}

export async function getNotifications(userId: string, limit: number = 20) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      actor: {
        select: {
          id: true,
          name: true
        }
      },
      question: {
        select: {
          id: true,
          title: true
        }
      },
      answer: {
        select: {
          id: true,
          body: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}

export async function getFollowStats(userId: string) {
  const [followingCount, followersCount] = await Promise.all([
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.follow.count({ where: { followingId: userId } })
  ]);

  return {
    followingCount,
    followersCount
  };
}

export async function isFollowing(followerId: string, followingId: string) {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId
      }
    }
  });

  return !!follow;
}

export async function getFollowingList(userId: string) {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          name: true,
          score: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getFollowersList(userId: string) {
  return prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          score: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

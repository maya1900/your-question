import Link from "next/link";

export function AdminPagination({
  basePath,
  params,
  pagination
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  pagination: {
    page: number;
    pageCount: number;
    total: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}) {
  function href(page: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    if (page > 1) query.set("page", String(page));
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  }

  return (
    <div className="admin-pagination">
      <span>
        共 {pagination.total} 条，第 {pagination.page} / {pagination.pageCount} 页
      </span>
      <div className="button-row">
        {pagination.hasPrev ? (
          <Link className="btn small" href={href(pagination.page - 1)}>
            上一页
          </Link>
        ) : (
          <span className="btn small disabled">上一页</span>
        )}
        {pagination.hasNext ? (
          <Link className="btn small" href={href(pagination.page + 1)}>
            下一页
          </Link>
        ) : (
          <span className="btn small disabled">下一页</span>
        )}
      </div>
    </div>
  );
}

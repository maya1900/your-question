import Link from "next/link";

const items = [
  { href: "/admin", label: "概览" },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/questions", label: "问题" },
  { href: "/admin/answers", label: "回答" },
  { href: "/admin/tags", label: "标签" }
];

export function AdminNav({ current }: { current: string }) {
  return (
    <nav className="admin-nav" aria-label="后台管理导航">
      {items.map((item) => (
        <Link aria-current={current === item.href ? "page" : undefined} href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

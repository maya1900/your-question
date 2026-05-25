export function formatRelativeTime(value: Date) {
  const diff = Date.now() - value.getTime();
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < day * 2) return "昨天";
  return `${Math.floor(diff / day)} 天前`;
}

export function compactNumber(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "问";
}

export function slugifyTag(value: string) {
  const text = value.trim().toLowerCase();
  const mapped = tagSlugMap[text];
  if (mapped) return mapped;

  const ascii = text
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return ascii || encodeURIComponent(text);
}

const tagSlugMap: Record<string, string> = {
  生活: "life",
  学习: "study",
  职场: "work",
  消费: "buying",
  城市: "city",
  健康: "health",
  居家: "home",
  租房: "renting",
  防潮: "moisture",
  沟通: "communication",
  备考: "exam",
  家电: "appliance"
};

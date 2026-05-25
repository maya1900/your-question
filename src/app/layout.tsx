import type { Metadata } from "next";
import "@/app/globals.css";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "栈问社区",
  description: "发布问题、回答问题、点赞有价值内容，并通过积分沉淀可信贡献。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}

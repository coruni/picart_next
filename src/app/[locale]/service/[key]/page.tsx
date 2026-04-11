import { getPublicConfig } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

// URL key 到 config key 的映射
const KEY_MAP: Record<string, string> = {
  privacy: "site_privacy_policy",
  terms: "site_terms_of_service",
};

const VALID_URL_KEYS = Object.keys(KEY_MAP);

const PAGE_TITLES: Record<string, string> = {
  privacy: "privacyPolicy",
  terms: "termsOfService",
};

// 检测内容是否为 HTML
const isHtmlContent = (content: string): boolean => {
  const htmlTagPattern = /<[a-z][\s\S]*>/i;
  return htmlTagPattern.test(content);
};

// 简单的 Markdown 转 HTML 函数
const markdownToHtml = (markdown: string): string => {
  return markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^\*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
    .replace(/^\- (.*$)/gim, "<ul><li>$1</li></ul>")
    .replace(/^\* (.*$)/gim, "<ul><li>$1</li></ul>")
    .replace(/^\d+\. (.*$)/gim, "<ol><li>$1</li></ol>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(/^---$/gim, "<hr />")
    .replace(/^\*\*\*$/gim, "<hr />")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
};

const contentClassName = cn(
  "rounded-xl bg-card p-4 text-sm leading-relaxed md:p-6",
  "[&_h1]:mb-4 [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-foreground",
  "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:my-3",
  "[&_a]:text-primary [&_a:hover]:underline",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_del]:line-through",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-primary",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-muted/50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:italic",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:ml-4 [&_ul]:my-3",
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:ml-4 [&_ol]:my-3",
  "[&_li]:my-1",
  "[&_hr]:my-6 [&_hr]:border-border",
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground",
  "[&_td]:border [&_td]:border-border [&_td]:p-2",
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}): Promise<Metadata> {
  const { locale, key } = await params;

  if (!VALID_URL_KEYS.includes(key)) {
    return { title: "Not Found" };
  }

  const t = await getTranslations({ locale, namespace: "sitePages" });
  const titleKey = PAGE_TITLES[key];

  return {
    title: t(titleKey),
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { key } = await params;

  if (!VALID_URL_KEYS.includes(key)) {
    notFound();
  }

  const configKey = KEY_MAP[key];
  const config = await getPublicConfig();
  const content =
    (config as Record<string, string | undefined | number | boolean>)?.[
      configKey
    ] || "";

  if (!content) {
    return (
      <div className="page-container">
        <div className="left-container">
          <div className="rounded-xl bg-card p-8 text-center text-muted-foreground">
            No content available
          </div>
        </div>
      </div>
    );
  }

  const isHtml = isHtmlContent(content as string);
  const htmlContent = isHtml ? content : markdownToHtml(content as string);

  return (
    <div className="page-container">
      <div className="left-container">
        <div
          className={contentClassName}
          data-auto-translate-content
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}

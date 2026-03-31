import type { Metadata } from "next";
import Image from "next/image";
import { ReactNode } from "react";

import { AccountInfo, AccountTabs } from "@/components/account";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { generateAuthorMetadata } from "@/lib";
import { getAccountUser } from "../account-user";

interface AccountLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getAccountUser(id);
  return generateAuthorMetadata(user);
}

export default async function AccountLayout({
  children,
  params,
}: AccountLayoutProps) {
  const { id } = await params;
  const user = await getAccountUser(id);

  return (
    <>
      <div className="fixed z-0 box-border h-56 w-full md:h-75">
        <div className="absolute top-0 left-0 z-2 h-16 w-full bg-linear-to-b from-[#00000066] to-transparent md:h-20" />
        {user.background && (
          <Image
            quality={95}
            src={user.background}
            fill
            loading="eager"
            preload
            alt={`${user.nickname || user.username} background image`}
            className="h-full w-full object-cover object-bottom align-bottom"
          />
        )}
        <div className="absolute bottom-0 left-0 z-2 h-18 w-full bg-linear-to-t from-[#00000066] to-transparent md:h-25" />
      </div>

      <div className="relative z-10 mt-56 w-full bg-background md:mt-75">
        <AccountInfo user={user} />

        <div className="page-container px-3 pt-3! md:px-0 md:pt-4!">
          <div className="left-container">
            <div className="top-header-tabs sticky z-5 flex h-12 items-center overflow-x-auto rounded-t-xl border-b border-border bg-card px-4 md:h-14 md:px-8">
              <AccountTabs />
            </div>
            {children}
          </div>

          <div className="right-container">
            <Sidebar
              showArticleCreate={false}
              showRecommendTag={false}
              showRecommendUser={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}

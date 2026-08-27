import loginWidgetLeft from "@/assets/images/sidebar/login/login_widget_left.png";
import loginWidgetRight from "@/assets/images/sidebar/login/login_widget_right.png";
import {
  CertificationForm,
  type CertificationStatus,
} from "@/components/account/CertificationForm.client";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { serverApi } from "@/lib/server-api";
import { formatDateYMD } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Ban, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

const statusText = (
  status: string | undefined,
  t: (key: string) => string,
): string => {
  switch (status as CertificationStatus) {
    case "PENDING":
      return t("statusPending");
    case "APPROVED":
      return t("statusApproved");
    case "REJECTED":
      return t("statusRejected");
    case "REVOKED":
      return t("statusRevoked");
    default:
      return status || "-";
  }
};

const typeText = (itemType: string | undefined, t: (key: string) => string) => {
  return itemType === "OFFICIAL" ? t("typeOfficial") : t("typeCreator");
};

export default async function AccountCertificationPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("profile.certification");

  // 认证状态来自当前用户的认证状态接口（serverApi 自动附加登录态，未申请时为 null）
  const response = await serverApi.userCertificationControllerGetMyCertificationStatus();
  const certification = response.data?.data ?? null;

  // 有状态时直接展示状态卡片；驳回/撤销允许重新申请，仍展示申请表单
  const showForm =
    !certification ||
    certification.status === "REJECTED" ||
    certification.status === "REVOKED";

  return (
    <div className="page-container flex-col md:flex-row">
      {certification && (
        <div className="mx-auto max-w-3xl flex-1 flex-col flex justify-center items-center w-full">
          <div className="relative mt-4 mb-6 overflow-hidden rounded-xl border border-border bg-card p-6 text-center w-full sm:min-h-88">
            <Image
              draggable={false}
              src={loginWidgetLeft}
              alt="certification decoration left"
              width={84}
              height={84}
              loading="eager"
              className="object-cover left-0 top-0 absolute"
            />
            <Image
              draggable={false}
              src={loginWidgetRight}
              alt="certification decoration right"
              width={84}
              height={84}
              loading="eager"
              className="object-cover right-0 top-0 absolute"
            />

            {certification.status === "APPROVED" ? (
              <>
                <div className="mx-auto mb-3 flex size-24 items-center justify-center rounded-full text-green-600">
                  <svg
                    width="72"
                    height="72"
                    viewBox="0 0 72 72"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="approve-icon-circle"
                    />
                    <polyline
                      points="24,36 32,44 48,26"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      className="approve-icon-check"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  {typeText(certification.type, t)}
                </p>
                <p className="mt-1 text-lg font-extrabold text-green-600">
                  {t("statusApproved")}
                </p>
                <div className="mx-auto mt-5 max-w-sm space-y-3 text-left text-sm">
                  {certification.organizationName && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="shrink-0 text-muted-foreground">
                        {t("organizationNameLabel")}
                      </span>
                      <span className="text-right">
                        {certification.organizationName}
                      </span>
                    </div>
                  )}
                  {certification.slogan && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="shrink-0 text-muted-foreground">
                        {t("slogan")}
                      </span>
                      <span className="text-right">{certification.slogan}</span>
                    </div>
                  )}
                  {certification.reviewedAt && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="shrink-0 text-muted-foreground">
                        {t("certifiedAtLabel")}
                      </span>
                      <span className="text-right">
                        {formatDateYMD(certification.reviewedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    "mx-auto mb-3 flex size-24 items-center justify-center rounded-full",
                    certification.status === "REJECTED" && "text-red-500",
                    certification.status === "PENDING" && "bg-blue-50 text-blue-500",
                    certification.status === "REVOKED" && "bg-gray-100 text-gray-500",
                  )}
                >
                  {certification.status === "REJECTED" && (
                    <svg
                      width="72"
                      height="72"
                      viewBox="0 0 72 72"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="36"
                        cy="36"
                        r="30"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="reject-icon-circle"
                      />
                      <line
                        x1="24"
                        y1="24"
                        x2="48"
                        y2="48"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        className="reject-icon-line-1"
                      />
                      <line
                        x1="48"
                        y1="24"
                        x2="24"
                        y2="48"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        className="reject-icon-line-2"
                      />
                    </svg>
                  )}
                  {certification.status === "PENDING" && <Clock size={24} />}
                  {certification.status === "REVOKED" && <Ban size={24} />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {typeText(certification.type, t)}
                </p>
                <p className="mt-1 text-base font-semibold">
                  {statusText(certification.status, t)}
                </p>
                {certification.status === "REJECTED" &&
                  certification.reviewReason && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("reviewReason")}: {certification.reviewReason}
                    </p>
                  )}
              </>
            )}
          </div>
          {certification.status === "APPROVED" && (
            <div className="flex items-stretch justify-stretch gap-8">
              <Link href={`/account/${certification.userId}`} aria-label={t("back")}>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-8 min-w-20"
                >
                  {t("back")}
                </Button>
              </Link>
              <Link href={`/create/post`} aria-label={t("createPost")}>
                <Button
                  variant="primary"
                  className="flex-1 rounded-full h-8 min-w-20 text-nowrap"
                >
                  {t("createPost")}
                </Button>
              </Link>
            </div>
          )}
        </div>

      )}
      {showForm && (
        <div className="mx-auto max-w-3xl flex-1 rounded-xl bg-card flex-col flex w-full">
          <div className="flex h-14 items-center border-b border-border px-4 md:px-6 sticky top-header rounded-xl bg-card">
            <div className="flex h-full flex-1 items-center">
              <span className="pr-6 text-base font-bold">{t("title")}</span>
            </div>
          </div>
          <div className="flex-1 px-4 pb-4 flex-col flex">
            <CertificationForm id={id} certification={certification} key={id} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { orderControllerCreateMembershipOrder, paymentControllerCreatePayment } from "@/api";
import { cn, getErrorMessage, showToast } from "@/lib";
import { useAppStore, useUserStore } from "@/stores";
import { UserProfile } from "@/types";
import { Asterisk, IdCard, RussianRuble, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";

type UserInfoWidgetProps = {
  author?: UserProfile;
};

export const UserInfoWidget = ({ author }: UserInfoWidgetProps) => {
  const t = useTranslations("sidebar");
  const tResponse = useTranslations("response");
  const user = useUserStore((state) => state.user);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<"1m" | "3m" | "6m" | "12m" | "lifetime">("1m");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'alipay' | 'wechat' | 'usdt' | null>(null);
  const [loading, setLoading] = useState(false);
  const userId = author?.id ?? t("unknownValue");
  const userLevel = author?.level ?? 0;
  const userBalance = author?.wallet ?? 0;
  const userPoints = author?.points ?? 0;
  const isOwner =
    user?.id != null &&
    author?.id != null &&
    String(user.id) === String(author.id);

  // 会员状态
  const membershipStatus = author?.membershipStatus;
  const isVip = membershipStatus === "ACTIVE";
  const siteConfig = useAppStore((state) => state.siteConfig);
  // 自定义订阅列表
  const membershipPriceKeys = Object.keys(siteConfig).filter(key =>
    key.startsWith('membership_price_')
  ).filter(key => key !== 'membership_price_lifetime');

  const membershipPriceList = membershipPriceKeys.map(key => ({
    plan: key.split('_').pop(), // 取最后一个 _ 之后的内容
    value: siteConfig[key as keyof typeof siteConfig]
  }));

  const epayEnabled = siteConfig.payment_epay_enabled;

  // 可用支付方式
  const availablePayments: ('alipay' | 'wechat' | 'usdt')[] = [];
  if (siteConfig.payment_alipay_enabled || (epayEnabled && siteConfig.payment_epay_alipay_enabled)) availablePayments.push('alipay');
  if (siteConfig.payment_wechat_enabled || (epayEnabled && siteConfig.payment_epay_wxpay_enabled)) availablePayments.push('wechat');
  if (epayEnabled && siteConfig.payment_epay_usdt_enabled) availablePayments.push('usdt');

  const hanleOpenRechargeModal = () => {
    setOpenModal(true);
    setSelectedPaymentMethod(null); // 重置选择
  };

  const showApiError = (error: unknown, fallbackKey: string) => {
    const apiMessage = getErrorMessage(error, t(fallbackKey));
    const messageKey =
      typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : undefined;

    if (messageKey?.startsWith("response.")) {
      const responseKey = messageKey.replace(/^response\./, "");
      showToast(tResponse(responseKey));
      return;
    }

    showToast(apiMessage);
  };

  const handleRecharge = async () => {
    if (!selectedPaymentMethod) return;
    try {
      setLoading(true);
      const orderRes = await orderControllerCreateMembershipOrder({
        throwOnError: true,
        body: { plan: currentPlan }
      });

      const orderId = orderRes.data?.data?.data.id;
      if (!orderId) {
        showToast(t("rechargeFailed"));
        return;
      }

      const shouldUseEpay = selectedPaymentMethod === 'usdt' ||
        (selectedPaymentMethod === 'alipay' && !siteConfig.payment_alipay_enabled) ||
        (selectedPaymentMethod === 'wechat' && !siteConfig.payment_wechat_enabled);
      const paymentMethod = shouldUseEpay
        ? 'EPAY'
        : selectedPaymentMethod === 'alipay'
          ? 'ALIPAY'
          : 'WECHAT';
      const type = shouldUseEpay
        ? (selectedPaymentMethod === 'wechat' ? 'wxpay' : selectedPaymentMethod)
        : undefined;
      const paymentRes = await paymentControllerCreatePayment({
        throwOnError: true,
        body: {
          orderId,
          paymentMethod,
          type,
          returnUrl: window.location.href
        }
      });

      if (paymentRes.data?.data?.data?.paymentUrl) {
        window.location.href = paymentRes.data.data.data.paymentUrl;
      } else {
        showToast(t("rechargeFailed"));
      }
    } catch (error) {
      console.error('Payment error:', error);
      showApiError(error, "rechargeFailed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="bg-card p-4 rounded-xl">
        <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3">
          <span>{t("userInfo")}</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-1">
            <IdCard size={18} className="text-primary" />
            <span className="text-secondary text-xs flex-1">
              {t("idCard", { id: userId })}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Asterisk size={18} className="text-[#7C6CFF]" />
            <span className={cn("text-secondary text-xs flex-1", isVip && "text-[#7C6CFF]")}>
              {t("level", { level: userLevel })}
            </span>
          </div>
          {isOwner && (
            <>
              <div className="flex items-center space-x-1">
                <Wallet size={18} className="text-[#4F9CFF]" />
                <span className="text-secondary text-xs flex-1">
                  {t("balance", { amount: userBalance })}
                </span>
                <Button className="h-full rounded-full px-2 py-0.5 text-xs" onClick={hanleOpenRechargeModal}>{t("recharge")}</Button>
              </div>
              <div className="flex items-center space-x-1">
                <RussianRuble size={18} className="text-[#5EEAD4]" />
                <span className="text-secondary text-xs flex-1">
                  {t("points", { amount: userPoints })}
                </span>
              </div>
            </>
          )}
        </div>
      </section>
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className=" p-0 md:max-w-xl flex flex-col max-h-[85vh]">
          <DialogHeader className="p-4">
            <DialogTitle className="text-sm font-semibold">{t("rechargeMembership")}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex-col space-y-2 min-h-0 px-4">
            {membershipPriceList?.map((item) => (
              <div
                key={item.plan}
                className={cn(
                  "border border-border px-3 py-4 rounded-lg",
                  "flex items-center justify-between cursor-pointer",
                  item.plan === currentPlan && "border-primary bg-primary/10 text-primary"
                )}
                onClick={() => setCurrentPlan(item.plan as "1m" | "3m" | "6m" | "12m" | "lifetime")}
              >
                <h3 className="text-sm font-semibold">{t(`membershipPlans.${item.plan}`)}</h3>
                <span>
                  <span className="text-xs">
                    ￥
                  </span>
                  {item.value}
                </span>
              </div>
            ))}

          </div>
          <DialogFooter className="px-4 pb-4 flex-col">
            {availablePayments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm text-secondary">{t("selectPaymentMethod")}</h4>
                <div className="flex space-x-2">
                  {availablePayments.map(method => (
                    <Button
                      key={method}
                      variant={selectedPaymentMethod === method ? "primary" : "outline"}
                      className={cn(
                        " rounded-full border text-xs",
                      )}
                      onClick={() => setSelectedPaymentMethod(method)}
                    >
                      {t(`paymentMethods.${method}`)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {availablePayments.length === 0 ? (
              <div className="text-center text-secondary text-sm">{t("noPaymentMethods")}</div>
            ) : (
              <Button
                fullWidth
                loading={loading}
                className="rounded-full h-9 mt-2"
                onClick={handleRecharge} disabled={!selectedPaymentMethod}>
                {t("recharge")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>


  );
};

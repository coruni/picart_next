/**
 * SEO 使用示例
 * 
 * 展示如何在不同场景下使用 SEO 配置
 */

import { getPublicConfig } from "@/lib/seo";

/**
 * 示例 1: 在服务端组件中使用公共配置
 */
export async function SiteInfoExample() {
  const config = await getPublicConfig();

  if (!config) {
    return <div>配置加载失败</div>;
  }

  return (
    <div className="p-6 bg-card rounded-lg border border-border">
      <h2 className="text-2xl font-bold mb-4">{config.site_name}</h2>
      <p className="text-muted-foreground mb-2">{config.site_subtitle}</p>
      <p className="text-sm text-muted-foreground">{config.site_description}</p>
      
      {config.maintenance_mode && (
        <div className="mt-4 p-4 bg-warning-50 border border-warning-500 rounded-md">
          <p className="text-warning-600 font-semibold">维护模式</p>
          <p className="text-sm text-warning-600">{config.maintenance_message}</p>
        </div>
      )}

      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="font-semibold">用户注册:</span>{" "}
          {config.user_registration_enabled ? "开启" : "关闭"}
        </p>
        <p>
          <span className="font-semibold">邮箱验证:</span>{" "}
          {config.user_email_verification ? "需要" : "不需要"}
        </p>
        <p>
          <span className="font-semibold">邀请码:</span>{" "}
          {config.invite_code_required ? "必需" : "可选"}
        </p>
      </div>
    </div>
  );
}

/**
 * 示例 2: 显示会员价格
 */
export async function MembershipPriceExample() {
  const config = await getPublicConfig();

  if (!config || !config.membership_enabled) {
    return null;
  }

  const plans = [
    { duration: "1个月", price: config.membership_price_1m },
    { duration: "3个月", price: config.membership_price_3m },
    { duration: "6个月", price: config.membership_price_6m },
    { duration: "12个月", price: config.membership_price_12m },
    { duration: "终身", price: config.membership_price_lifetime },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {config.membership_name || "会员"}套餐
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.duration}
            className="p-4 bg-card border border-border rounded-lg hover:border-primary-500 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">{plan.duration}</h3>
            <p className="text-3xl font-bold text-primary-500">
              ¥{plan.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 示例 3: 显示支付方式
 */
export async function PaymentMethodsExample() {
  const config = await getPublicConfig();

  if (!config) {
    return null;
  }

  const methods = [
    {
      name: "支付宝",
      enabled: config.payment_alipay_enabled,
      icon: "💳",
    },
    {
      name: "微信支付",
      enabled: config.payment_wechat_enabled,
      icon: "💚",
    },
    {
      name: "易支付",
      enabled: config.payment_epay_enabled,
      icon: "💰",
    },
  ];

  const enabledMethods = methods.filter((m) => m.enabled);

  if (enabledMethods.length === 0) {
    return null;
  }

  return (
    <div className="p-6 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-semibold mb-4">支持的支付方式</h3>
      <div className="flex gap-4">
        {enabledMethods.map((method) => (
          <div
            key={method.name}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md"
          >
            <span className="text-2xl">{method.icon}</span>
            <span className="text-sm font-medium">{method.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 示例 4: 显示 App 下载信息
 */
export async function AppDownloadExample() {
  const config = await getPublicConfig();

  if (!config || config.app_maintenance) {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-2">{config.app_name}</h2>
      <p className="text-sm opacity-90 mb-6">版本 {config.app_version}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.app_ios_download_url && (
          <a
            href={config.app_ios_download_url}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <span className="text-2xl">🍎</span>
            <div>
              <p className="text-xs opacity-80">Download on the</p>
              <p className="font-semibold">App Store</p>
              <p className="text-xs opacity-80">v{config.app_ios_version}</p>
            </div>
          </a>
        )}

        {config.app_android_download_url && (
          <a
            href={config.app_android_download_url}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-xs opacity-80">Get it on</p>
              <p className="font-semibold">Google Play</p>
              <p className="text-xs opacity-80">v{config.app_android_version}</p>
            </div>
          </a>
        )}
      </div>

      {config.app_force_update && (
        <div className="mt-4 p-3 bg-white/20 rounded-md">
          <p className="text-sm font-semibold">⚠️ 强制更新提示</p>
          <p className="text-xs opacity-90 mt-1">{config.app_update_message}</p>
        </div>
      )}
    </div>
  );
}

/**
 * 示例 5: 显示广告位（如果启用）
 */
export async function AdPlacementExample({ position }: { position: "homepage" | "article_top" | "article_bottom" }) {
  const config = await getPublicConfig();

  if (!config) {
    return null;
  }

  let enabled = false;
  let content = "";

  switch (position) {
    case "homepage":
      enabled = config.ad_homepage_enabled;
      content = config.ad_homepage_content;
      break;
    case "article_top":
      enabled = config.ad_article_top_enabled;
      content = config.ad_article_top_content;
      break;
    case "article_bottom":
      enabled = config.ad_article_bottom_enabled;
      content = config.ad_article_bottom_content;
      break;
  }

  if (!enabled || !content) {
    return null;
  }

  return (
    <div className="my-4 p-4 bg-muted rounded-lg border border-border">
      <p className="text-xs text-muted-foreground mb-2">广告</p>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

/**
 * 示例 6: 收藏夹限制提示
 */
export async function FavoriteInfoExample() {
  const config = await getPublicConfig();

  if (!config) {
    return null;
  }

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <h3 className="text-sm font-semibold mb-2">收藏夹说明</h3>
      <ul className="text-sm text-muted-foreground space-y-1">
        <li>• 免费用户最多创建 {config.favorite_max_free_count} 个收藏夹</li>
        <li>• 创建额外收藏夹需要 {config.favorite_create_cost} 积分</li>
      </ul>
    </div>
  );
}

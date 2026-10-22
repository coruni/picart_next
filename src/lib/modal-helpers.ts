import { useModalStore } from "@/stores/useModalStore";

/**
 * Modal ID 常量
 */
export const MODAL_IDS = {
  LOGIN: "login-dialog",
  REGISTER: "register-dialog",
  FORGOT_PASSWORD: "forgot-password-dialog",
  // 可以继续添加其他 modal ID
  AVATAR_FRAME: "avatar-frame-dialog",
  COMMENT_BUBBLE: "comment-bubble-dialog",
  ACHIEVEMENT_BADGE: "achievement-badge-dialog",
} as const;

/**
 * 通用打开对话框函数
 */
export function openModal(id: string, data?: Record<string, unknown>) {
  useModalStore.getState().openModal(id, data as Record<string, unknown>);
}

/**
 * 打开登录对话框
 */
export function openLoginDialog() {
  useModalStore.getState().openModal(MODAL_IDS.LOGIN);
}

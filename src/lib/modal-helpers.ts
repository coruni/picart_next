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

/**
 * 关闭登录对话框
 */
export function closeLoginDialog() {
  useModalStore.getState().closeModal(MODAL_IDS.LOGIN);
}

/**
 * 打开注册对话框
 */
export function openRegisterDialog() {
  useModalStore.getState().openModal(MODAL_IDS.REGISTER);
}

/**
 * 关闭注册对话框
 */
export function closeRegisterDialog() {
  useModalStore.getState().closeModal(MODAL_IDS.REGISTER);
}

/**
 * 打开忘记密码对话框
 */
export function openForgotPasswordDialog() {
  useModalStore.getState().openModal(MODAL_IDS.FORGOT_PASSWORD);
}

/**
 * 关闭忘记密码对话框
 */
export function closeForgotPasswordDialog() {
  useModalStore.getState().closeModal(MODAL_IDS.FORGOT_PASSWORD);
}

/**
 * 打开头像框架对话框
 */
export function openAvatarFrameDialog() {
  useModalStore.getState().openModal(MODAL_IDS.AVATAR_FRAME);
}

/**
 * 关闭头像框架对话框
 */
export function closeAvatarFrameDialog() {
  useModalStore.getState().closeModal(MODAL_IDS.AVATAR_FRAME);
}

/**
 * 打开评论气泡对话框
 */
export function openCommentBubbleDialog() {
  useModalStore.getState().openModal(MODAL_IDS.COMMENT_BUBBLE);
}

/**
 * 关闭评论气泡对话框
 */
export function closeCommentBubbleDialog() {
  useModalStore.getState().closeModal(MODAL_IDS.COMMENT_BUBBLE);
}

/**
 * 打开成就徽章对话框
 */
export function openAchievementBadgeDialog() {
  useModalStore.getState().openModal(MODAL_IDS.ACHIEVEMENT_BADGE);
}

/**
 * 关闭成就徽章对话框
 */
export function closeAchievementBadgeDialog() {
  useModalStore.getState().closeModal(MODAL_IDS.ACHIEVEMENT_BADGE);
}


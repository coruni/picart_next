import { useModalStore } from "@/stores/useModalStore";

/**
 * Modal ID 常量
 */
export const MODAL_IDS = {
  LOGIN: "login-dialog",
  REGISTER: "register-dialog",
  FORGOT_PASSWORD: "forgot-password-dialog",
  // 可以继续添加其他 modal ID
} as const;

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

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent } from "../ui/Dialog";
import { useAppStore, useModalStore, useUserStore } from "@/stores";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useForm } from "@/hooks/useForm";
import { Form, FormField } from "../ui/Form";
import { FloatingInput } from "../ui/FloatingInput";
import { Button } from "../ui/Button";
import { userControllerLogin, userControllerRegisterUser, userControllerSendVerificationCode, userControllerResetPassword } from "@/api";

type LoginFormData = {
    account: string;
    password: string;
}

type RegisterFormData = {
    username: string;
    email?: string;
    password: string;
    confirmPassword: string;
    inviteCode?: string;
    verificationCode?: string;
}

type ResetPasswordData = {
    email: string;
    password: string;
    confirmPassword: string;
    code: string;
}

export function UserLoginDialog() {
    const t = useTranslations("login");
    const tReg = useTranslations("register");
    const tReset = useTranslations("resetPassword");
    const tForm = useTranslations("form");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<"login" | "register" | "reset">("login");
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const loginDialogOpen = useModalStore((state) => state.isOpen(MODAL_IDS.LOGIN));
    const closeModal = useModalStore((state) => state.closeModal);
    const siteConfig = useAppStore((state) => state.siteConfig);

    // 使用 selector 获取响应式方法
    const setToken = useUserStore((state) => state.setToken);
    const setUser = useUserStore((state) => state.setUser);

    // 是否需要邮箱验证
    const needEmailVerification = siteConfig?.user_email_verification === true;

    // 登录表单
    const loginForm = useForm<LoginFormData>({
        initialValues: {
            account: "",
            password: "",
        },
        validationRules: {
            account: {
                required: tForm("accountRequired"),
            },
            password: {
                required: tForm("passwordRequired"),
            }
        },
        async onSubmit(values) {
            setIsSubmitting(true);
            try {
                const { data } = await userControllerLogin({
                    body: loginForm.values
                })
                setToken(data?.data.token!)
                setUser(Object.assign({}, data?.data, { token: undefined, refreshToken: undefined }));
                window.location.reload();
            } catch (error) {
                console.error(t("loginFailed"), error);
                setIsSubmitting(false);
            }
        },
    });

    // 注册表单
    const registerForm = useForm<RegisterFormData>({
        initialValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            inviteCode: "",
            verificationCode: "",
        },
        validationRules: {
            username: {
                required: tForm("required"),
            },
            email: {
                required: tForm("required"),
                pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: tForm("invalidEmail"),
                }
            },
            password: {
                required: tForm("passwordRequired"),
                minLength: {
                    value: 6,
                    message: tForm("passwordTooShort"),
                }
            },
            confirmPassword: {
                required: tForm("passwordRequired"),
                validate: (value) => {
                    const password = registerForm.values?.password;
                    if (value && password && value !== password) {
                        return tReg("passwordMismatch");
                    }
                    return true;
                }
            },
            verificationCode: needEmailVerification ? {
                required: tForm("required"),
            } : undefined,
        },
        async onSubmit(values) {
            setIsSubmitting(true);
            try {
                const { username, email, password, inviteCode, verificationCode } = values;

                const { data } = await userControllerRegisterUser({
                    body: {
                        username,
                        email: email || undefined,
                        password,
                        inviteCode: inviteCode || undefined,
                        verificationCode: needEmailVerification ? verificationCode : undefined,
                    }
                });

                setToken(data?.data.token!);
                setUser(Object.assign({}, data?.data, { token: undefined, refreshToken: undefined }));
                window.location.reload();
            } catch (error) {
                console.error(tReg("registerFailed"), error);
                setIsSubmitting(false);
            }
        },
    });

    // 重置密码表单
    const resetForm = useForm<ResetPasswordData>({
        initialValues: {
            email: "",
            password: "",
            confirmPassword: "",
            code: "",
        },
        validationRules: {
            email: {
                required: tForm("required"),
                pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: tForm("invalidEmail"),
                }
            },
            password: {
                required: tForm("passwordRequired"),
                minLength: {
                    value: 6,
                    message: tForm("passwordTooShort"),
                }
            },
            confirmPassword: {
                required: tForm("passwordRequired"),
                validate: (value) => {
                    const password = resetForm.values?.password;
                    if (value && password && value !== password) {
                        return tReset("passwordMismatch");
                    }
                    return true;
                }
            },
            code: {
                required: tForm("required"),
            },
        },
        async onSubmit(values) {
            setIsSubmitting(true);
            try {
                await userControllerResetPassword({
                    body: {
                        email: values.email,
                        newPassword: values.password,
                        code: values.code,
                    }
                });

                // 重置成功，切换回登录模式
                alert(tReset("resetSuccess"));
                setMode("login");
                resetForm.reset();
            } catch (error) {
                console.error(tReset("resetFailed"), error);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    // 发送验证码
    const handleSendCode = async (email: string) => {
        if (!email) {
            return;
        }

        setIsSendingCode(true);
        try {
            await userControllerSendVerificationCode({
                body: { email, type: 'reset_password' }
            });

            // 开始倒计时
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            setCountdown(0)
            console.error("发送验证码失败:", error);
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            closeModal(MODAL_IDS.LOGIN);
            loginForm.reset();
            registerForm.reset();
            resetForm.reset();
            setIsSubmitting(false);
            setMode("login");
            setCountdown(0);
        }
    };

    const switchToRegister = () => {
        setMode("register");
        loginForm.reset();
        resetForm.reset();
        setIsSubmitting(false);
    };

    const switchToLogin = () => {
        setMode("login");
        registerForm.reset();
        resetForm.reset();
        setIsSubmitting(false);
    };

    const switchToReset = () => {
        setMode("reset");
        loginForm.reset();
        registerForm.reset();
        setIsSubmitting(false);
    };

    if (!loginDialogOpen) {
        return null;
    }

    return (
        <Dialog
            open={loginDialogOpen}
            onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-110 rounded-2xl max-h-[98vh]">
                <div className="flex flex-col">
                    {/* logo */}
                    <div className="w-50 h-14 mx-auto relative -mt-2 bg-cover bg-center" style={{ backgroundImage: `url(/placeholder/loginLogo.png)` }}>
                    </div>

                    {/* 标题 */}
                    <div className="my-6 text-center text-2xl font-semibold">
                        <span>
                            {mode === "login" && t("title")}
                            {mode === "register" && tReg("title")}
                            {mode === "reset" && tReset("title")}
                        </span>
                    </div>

                    {/* 登录表单 */}
                    {mode === "login" && (
                        <Form errors={loginForm.errors} onSubmit={loginForm.handleSubmit} touched={loginForm.touched}>
                            <FormField name="account" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={t("username")}
                                    {...loginForm.getFieldProps("account")}
                                    fullWidth
                                />
                            </FormField>
                            <FormField name="password" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={t("password")}
                                    type="password"
                                    {...loginForm.getFieldProps("password")}
                                    fullWidth
                                />
                            </FormField>
                            <div className="mt-12">
                                <Button
                                    size="lg"
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    className="rounded-lg"
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t("loggingIn") : t("loginButton")}
                                </Button>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    className="text-primary cursor-pointer hover:opacity-80"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        switchToReset();
                                    }}
                                >
                                    <span>{t("needHelp")}</span>
                                </button>
                                <button
                                    type="button"
                                    className="text-primary cursor-pointer hover:opacity-80"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        switchToRegister();
                                    }}
                                >
                                    <span>{t("registerNow")}</span>
                                </button>
                            </div>
                        </Form>
                    )}

                    {/* 注册表单 */}
                    {mode === "register" && (
                        <Form errors={registerForm.errors} onSubmit={registerForm.handleSubmit} touched={registerForm.touched}>
                            <FormField name="username" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={tReg("username")}
                                    {...registerForm.getFieldProps("username")}
                                    fullWidth
                                />
                            </FormField>

                            <FormField name="email" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={tReg("email")}
                                    type="email"
                                    {...registerForm.getFieldProps("email")}
                                    fullWidth
                                />
                            </FormField>

                            <FormField name="password" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={tReg("password")}
                                    type="password"
                                    {...registerForm.getFieldProps("password")}
                                    fullWidth
                                />
                            </FormField>

                            <FormField name="confirmPassword" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={tReg("confirmPassword")}
                                    type="password"
                                    {...registerForm.getFieldProps("confirmPassword")}
                                    fullWidth
                                />
                            </FormField>

                            <FormField name="inviteCode" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={`${tReg("inviteCode")} (${tReg("optional")})`}
                                    {...registerForm.getFieldProps("inviteCode")}
                                    fullWidth
                                />
                            </FormField>

                            {needEmailVerification && (
                                <FormField name="verificationCode" floating>
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <FloatingInput
                                                className="rounded-lg"
                                                label={tReg("verificationCode")}
                                                {...registerForm.getFieldProps("verificationCode")}
                                                fullWidth
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            size="lg"
                                            variant="outline"
                                            className="shrink-0 min-w-24"
                                            onClick={() => handleSendCode(registerForm.values.email || "")}
                                            disabled={!registerForm.values.email || isSendingCode || countdown > 0}
                                            loading={isSendingCode}
                                        >
                                            {countdown > 0 ? `${countdown}s` : tReg("sendCode")}
                                        </Button>
                                    </div>
                                </FormField>
                            )}

                            <div className="mt-12">
                                <Button
                                    size="lg"
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    className="rounded-lg"
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? tReg("registering") : tReg("registerButton")}
                                </Button>
                            </div>

                            <div className="mt-4 flex items-center justify-center text-sm">
                                <span className="text-muted-foreground">{tReg("alreadyHaveAccount")}</span>
                                <button
                                    type="button"
                                    className="ml-2 text-primary cursor-pointer hover:opacity-80"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        switchToLogin();
                                    }}
                                >
                                    {tReg("backToLogin")}
                                </button>
                            </div>
                        </Form>
                    )}

                    {/* 重置密码表单 */}
                    {mode === "reset" && (
                        <Form errors={resetForm.errors} onSubmit={resetForm.handleSubmit} touched={resetForm.touched}>
                            <FormField name="email" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={tReset("email")}
                                    type="email"
                                    {...resetForm.getFieldProps("email")}
                                    fullWidth
                                />
                            </FormField>

                            <FormField name="code" floating>
                                <div className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <FloatingInput
                                            className="rounded-lg"
                                            label={tReset("verificationCode")}
                                            {...resetForm.getFieldProps("code")}
                                            fullWidth
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="lg"
                                        variant="outline"
                                        className="shrink-0 min-w-24"
                                        onClick={() => handleSendCode(resetForm.values.email)}
                                        disabled={!resetForm.values.email || isSendingCode || countdown > 0}
                                        loading={isSendingCode}
                                    >
                                        {countdown > 0 ? `${countdown}s` : tReset("sendCode")}
                                    </Button>
                                </div>
                            </FormField>

                            <FormField name="password" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={tReset("newPassword")}
                                    type="password"
                                    {...resetForm.getFieldProps("password")}
                                    fullWidth
                                />
                            </FormField>

                            <FormField name="confirmPassword" floating>
                                <FloatingInput
                                    className="rounded-lg"
                                    label={tReset("confirmPassword")}
                                    type="password"
                                    {...resetForm.getFieldProps("confirmPassword")}
                                    fullWidth
                                />
                            </FormField>

                            <div className="mt-12">
                                <Button
                                    size="lg"
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    className="rounded-lg"
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? tReset("resetting") : tReset("resetButton")}
                                </Button>
                            </div>

                            <div className="mt-4 flex items-center justify-center text-sm">
                                <button
                                    type="button"
                                    className="text-primary cursor-pointer hover:opacity-80"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        switchToLogin();
                                    }}
                                >
                                    {tReset("backToLogin")}
                                </button>
                            </div>
                        </Form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "../ui/Dialog";
import { getPublicConfig } from "@/lib";
import { useModalStore, useUserStore } from "@/stores";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useForm } from "@/hooks/useForm";
import { Form, FormField } from "../ui/Form";
import { FloatingInput } from "../ui/FloatingInput";
import { Button } from "../ui/Button";
import { userControllerLogin } from "@/api";
type LoginFormData = {
    account: string;
    password: string;
}
export function UserLoginDialog() {
    const [config, setConfig] = useState<Awaited<ReturnType<typeof getPublicConfig>> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const loginDialogOpen = useModalStore((state) => state.isOpen(MODAL_IDS.LOGIN));
    const closeModal = useModalStore((state) => state.closeModal);
    
    // 使用 selector 获取响应式方法
    const setToken = useUserStore((state) => state.setToken);
    const setUser = useUserStore((state) => state.setUser);
    
    const form = useForm<LoginFormData>({
        initialValues: {
            account: "",
            password: "",
        },
        validationRules: {
            account: {
                required: "账号不能为空",
            },
            password: {
                required: "密码不能为空",
            }
        },
        async onSubmit(values) {
            setIsSubmitting(true);
            try {
                const { data } = await userControllerLogin({
                    body: form.values
                })
                // 保存token
                setToken(data?.data.token!)
                // 保存用户信息 要排除token 和refreshToken
                setUser(Object.assign({}, data?.data, { token: undefined, refreshToken: undefined }));
                // 完成之后刷新本页面
                window.location.reload();
            } catch (error) {
                console.error("登录失败:", error);
                setIsSubmitting(false);
            }
        },
    })

    const handleLoginDialogClose = (open: boolean) => {
        if (!open) {
            closeModal(MODAL_IDS.LOGIN);
            // 关闭时重置表单和提交状态
            form.reset();
            setIsSubmitting(false);
        }
    };

    // 获取网站配置
    useEffect(() => {
        const fetchConfig = async () => {
            const data = await getPublicConfig();
            setConfig(data);
        };

        fetchConfig();
    }, [])

    // 关闭时不渲染任何内容，完全卸载
    if (!loginDialogOpen) {
        return null;
    }


    return (
        <Dialog
            open={loginDialogOpen}
            onOpenChange={handleLoginDialogClose}>
            <DialogContent className=" max-w-110 rounded-2xl">
                <div className="flex flex-col">
                    {/* logo */}
                    <div className="w-50 h-14 mx-auto relative -mt-2 bg-cover" style={{ backgroundImage: `url(${config?.site_logo})` }}>
                    </div>
                    {/* 标题 */}
                    <div className="my-4 text-center text-2xl font-semibold">
                        <span>账号登录</span>
                    </div>
                    <Form errors={form.errors} onSubmit={form.handleSubmit} touched={form.touched}>
                        <FormField name="account" floating>
                            <FloatingInput className="rounded-lg" label="用户名" {...form.getFieldProps("account")} fullWidth />
                        </FormField>
                        <FormField name="password" floating>
                            <FloatingInput className="rounded-lg" label="密码" type="password" {...form.getFieldProps("password")} fullWidth />
                        </FormField>
                        <div className="mt-14">
                            <Button
                                size="lg"
                                type="submit"
                                variant="primary"
                                fullWidth
                                className="rounded-lg"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "登录中..." : "登录"}
                            </Button>
                        </div>

                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
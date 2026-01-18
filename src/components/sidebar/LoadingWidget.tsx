"use client"
import { useUserStore } from "@/stores"
import Image from "next/image"
import { Button } from "../ui/Button"
import { openLoginDialog } from "@/lib/modal-helpers"

export const LoginWidget = () => {
    const isAuthenticated = useUserStore((state) => state.isAuthenticated)
    if (isAuthenticated) return null;

    return (
        <section className="px-4 pt-4 pb-2.5 bg-card rounded-xl ">
            {/* 卡片左上角 */}
            <Image src="/sidebar/login/login_widget_left.png" alt="login widget left side" width={84} height={84} className="object-cover left-0 top-0 absolute"></Image>
            <Image src="/sidebar/login/login_widget_right.png" alt="login widget right side" width={84} height={84} className="object-cover right-0 top-0 absolute"></Image>
            {/* 文案 */}
            <span className=" line-clamp-3 text-ellipsis leading-5 wrap-break-word text-center overflow-hidden text-sm my-8">
                只需几秒即可登录，查看更多精彩内容。
            </span>

            {/* 登录按钮 */}
            <div className="py-2.5 flex items-center justify-center">
                <Button className="w-50 h-10 rounded-full" onClick={openLoginDialog}>登录</Button>
            </div>
        </section>
    )
}
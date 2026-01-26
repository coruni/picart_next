import { ReactNode } from "react";

interface ChannelLayoutProps {
    children: ReactNode;
    params: Promise<{ pid: string; locale: string }>;
}
export default async function ChannelLayout({ children, params }: ChannelLayoutProps) {
    const { pid, locale } = await params;
    return (
        <>
            {/* 背景 */}
            <div className="fixed top-15 h-101 w-full">

            </div>
        </>
    )
}
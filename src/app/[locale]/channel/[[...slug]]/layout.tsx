import { categoryControllerFindAll } from "@/api";
import { ReactNode } from "react";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChannelTabs } from "@/components/channel/ChannelTabs";

interface ChannelLayoutProps {
    children: ReactNode;
    params: Promise<{ slug?: string[]; locale: string }>;
}

export default async function ChannelLayout({ children, params }: ChannelLayoutProps) {
    const { slug } = await params;
    
    // 如果没有 slug 或者 slug 为空，不显示背景
    if (!slug || slug.length === 0) {
        return <>{children}</>;
    }
    
    const pid = slug[0];
    
    // 获取分类列表
    const { data } = await categoryControllerFindAll({ query: { page: 1, limit: 100 } });
    const currentChannel = data?.data.data.find((item) => item.id === Number(pid));
    
    if (!currentChannel) {
        return <>{children}</>;
    }
    
    return (
        <>
            {/* 背景 */}
            <div className="fixed top-15 h-101 w-full z-0">
                <Image 
                    quality={95} 
                    src={currentChannel?.background || currentChannel?.avatar || '/placeholder/empty.png'} 
                    fill 
                    alt={`${currentChannel?.name} background image`} 
                    className="w-full h-full object-cover" 
                />
                <div 
                    className="absolute bottom-0 left-0 w-full z-2 h-70" 
                    style={{ background: 'linear-gradient(180deg, rgba(245, 246, 251, 0) 0%, #f5f6fb 100%)' }} 
                />
            </div>
            
            {/* 页面内容 */}
            <div className="mt-60 w-full z-10 relative dark:bg-gray-800">
                <div className="page-container">
                    <div className="left-container">
                        <div className="px-10 h-14 flex items-center border-b border-border sticky top-[60px] bg-card z-5 rounded-t-xl">
                            <ChannelTabs children={currentChannel.children} parentId={pid} />
                        </div>
                        {children}
                    </div>
                    <div className="right-container">
                        <Sidebar />
                    </div>
                </div>
            </div>
        </>
    );
}

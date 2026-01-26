import { generateTopicMetadata } from "@/lib/seo";
import { Metadata } from "next";
type TopicDetailPageProps = {
    params: Promise<{
        id: string;
        locale: string;
    }>;
    searchParams: Promise<{
        commentId?: string;
    }>;
};

export default async function TopicDetailPage(props: TopicDetailPageProps) {
    const { locale, id } = await props.params
    return <div>topic detail page</div>;
}

import { redirect } from "next/navigation";

export default async function AccountTagPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  redirect(`/account/${id}/topic`);
}

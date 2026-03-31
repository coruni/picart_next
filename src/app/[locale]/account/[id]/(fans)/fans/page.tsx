import { redirect } from "next/navigation";

export default async function AccountFansPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  redirect(`/account/${id}/followers`);
}

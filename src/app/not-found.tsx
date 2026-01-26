import { getTranslations } from "next-intl/server";

export default function NotFound() {
  const t = getTranslations("notFound");

  return (
    <div className="h-screen items-center justify-center flex">
      <div></div>
    </div>
  );
}

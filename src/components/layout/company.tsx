import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from 'next/image'

export function Company() {
  const t = useTranslations("common");

  return (
    <Link      href="/dashboard"      className="flex items-center gap-2.5 font-bold"    >
      <span>{t("company")}</span>
    </Link>
  );
}
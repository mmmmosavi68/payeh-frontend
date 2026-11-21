import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from 'next/image'

export function Brand() {
  const t = useTranslations("common");

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 font-bold"
      aria-label={t("appName")}
    >
      {/* <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
        {t("brandMark")}
      </span> */}
       <Image
          src="/logo.png"
          width={40}
          height={40}
          alt="LOGO"
      />
      <span className="truncate">{t("appName")}</span>
    </Link>
  );
}
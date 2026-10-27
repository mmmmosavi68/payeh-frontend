import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

/** Set NEXT_PUBLIC_DEMO_CAPTCHA=1 in .env.local to preview the captcha slot. */
export const demoCaptchaEnabled = process.env.NEXT_PUBLIC_DEMO_CAPTCHA === "1";

export function CaptchaSlot() {
  const t = useTranslations("auth.captcha");

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center gap-3 rounded-md border border-dashed bg-muted/40 px-3 py-4 text-xs text-muted-foreground"
    >
      <ShieldCheck className="size-5 shrink-0" aria-hidden />
      {t("placeholder")}
    </div>
  );
}
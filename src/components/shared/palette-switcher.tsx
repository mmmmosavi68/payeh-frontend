
"use client";

import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Palette as PaletteType } from "@/lib/theme";

const paletteOptions: {
  value: PaletteType;
  label: "palettes.neutral" | "palettes.indigo";
}[] = [
  { value: "neutral", label: "palettes.neutral" },
  { value: "indigo", label: "palettes.indigo" },
];

export function PaletteSwitcher() {
  const t = useTranslations("common");
  const { palette, setPalette } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={t("palette")}
        title={t("palette")}
        className="inline-flex size-9 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <Palette className="size-4" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel>{t("palette")}</DropdownMenuLabel>

        <DropdownMenuRadioGroup
          value={palette}
          onValueChange={(value) => {
            if (value === "neutral" || value === "indigo") {
              setPalette(value);
            }
          }}
        >
          {paletteOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
            >
              {t(option.label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

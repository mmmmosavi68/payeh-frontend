import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = React.ComponentProps<"input"> & {
  id: string;
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
};

export function AuthField({
  id,
  label,
  icon,
  trailing,
  error,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("h-10", icon && "ps-10", trailing && "pe-10", className)}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 end-1.5 flex items-center">
            {trailing}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
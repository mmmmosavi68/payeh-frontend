
"use client";

import { useState } from "react";
import { Loader2, Trash2, UserRoundX } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import {
  bulkDeactivateUsers,
  bulkDeleteUsers,
} from "../api";
import { usePermission } from "@/features/permissions/use-permission";

type Props = {
  selectedIds: string[];
  onClearSelection: () => void;
  onCompleted: () => void;
};

type BulkAction = "deactivate" | "delete" | null;

export function UserBulkActions({
  selectedIds,
  onClearSelection,
  onCompleted,
}: Props) {
  const t = useTranslations("users.management");

  const [confirmAction, setConfirmAction] = useState<BulkAction>(null);
  const [pending, setPending] = useState(false);

  const deactivatePermission = usePermission(
    "UserManagement",
    "BulkDeactivate",
  );

  const deletePermission = usePermission(
    "UserManagement",
    "BulkDelete",
  );

  const canDeactivate =
    !deactivatePermission.loading && deactivatePermission.allowed;

  const canDelete =
    !deletePermission.loading && deletePermission.allowed;

  function openConfirmation(action: Exclude<BulkAction, null>) {
    if (selectedIds.length === 0 || pending) return;
    setConfirmAction(action);
  }

  async function executeBulkAction() {
    if (!confirmAction || selectedIds.length === 0 || pending) return;

    setPending(true);

    try {
      const count = selectedIds.length;

      if (confirmAction === "deactivate") {
        await bulkDeactivateUsers(selectedIds);
        toast.success(t("bulk.deactivated", { count }));
      } else {
        await bulkDeleteUsers(selectedIds);
        toast.success(t("bulk.deleted", { count }));
      }

      setConfirmAction(null);
      onClearSelection();
      onCompleted();
    } finally {
      setPending(false);
    }
  }

  if (!canDeactivate && !canDelete) return null;
  if (selectedIds.length === 0) return null;

  return (
    <>
      <span className="px-2 text-sm text-muted-foreground">
        {t("bulk.selected", { count: selectedIds.length })}
      </span>

      {canDeactivate ? (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={() => openConfirmation("deactivate")}
        >
          {pending && confirmAction === "deactivate" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <UserRoundX className="size-4" aria-hidden />
          )}
          {t("bulk.deactivate")}
        </Button>
      ) : null}

      {canDelete ? (
        <Button
          type="button"
          variant="destructive"
          className="rounded-full"
          disabled={pending}
          onClick={() => openConfirmation("delete")}
        >
          {pending && confirmAction === "delete" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-4" aria-hidden />
          )}
          {t("bulk.delete")}
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(next) => {
          if (!next && !pending) setConfirmAction(null);
        }}
        title={
          confirmAction === "delete"
            ? t("bulk.deleteTitle")
            : t("bulk.deactivateTitle")
        }
        description={
          confirmAction === "delete"
            ? t("bulk.deleteDescription", {
                count: selectedIds.length,
              })
            : t("bulk.deactivateDescription", {
                count: selectedIds.length,
              })
        }
        confirmLabel={
          confirmAction === "delete"
            ? t("bulk.delete")
            : t("bulk.deactivate")
        }
        onConfirm={executeBulkAction}
      />
    </>
  );
}

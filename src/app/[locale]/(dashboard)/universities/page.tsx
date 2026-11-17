
"use client";

import { useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { FormField } from "@/components/shared/form-field";
import { useRemoteData } from "@/hooks/use-remote-data";

import { listCodes } from "@/features/codes/api";
import { Can } from "@/features/permissions/use-permission";

import {
  deleteUniversity,
  listUniversities,
} from "@/features/universities/api";

import {
  getUniversityTypeOptions,
} from "@/features/universities/options";

import type {
  UniversityDto,
  UniversityFilters,
} from "@/features/universities/types";

import { UniversitiesTable } from "@/features/universities/components/universities-table";
import { UniversityFormSheet } from "@/features/universities/components/university-form-sheet";

export default function UniversitiesPage() {
  const [filters, setFilters] = useState<UniversityFilters>({});
  const [searchText, setSearchText] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] =
    useState<UniversityDto | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<UniversityDto | null>(null);

  const filterKey = JSON.stringify(filters);

  const {
    data,
    loading,
    failed,
    reload,
  } = useRemoteData(
    `universities-${filterKey}`,
    () => listUniversities(filters),
  );

  const {
    data: parentUniversities,
    reload: reloadParents,
  } = useRemoteData(
    "university-parent-options",
    () => listUniversities({ isActive: true }),
  );

  const {
    data: codes,
    loading: codesLoading,
  } = useRemoteData("university-type-codes", listCodes);

  const universities = data ?? [];
  const parentOptions = parentUniversities ?? [];
  const universityTypes = getUniversityTypeOptions(codes ?? []);

  function handleCreate() {
    setEditingUniversity(null);
    setFormOpen(true);
  }

  function handleEdit(university: UniversityDto) {
    setEditingUniversity(university);
    setFormOpen(true);
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFilters((current) => ({
      ...current,
      search: searchText.trim() || undefined,
    }));
  }

  function handleRegionChange(value: string) {
    setFilters((current) => ({
      ...current,
      region: value ? Number(value) : undefined,
    }));
  }

  function handleTypeChange(value: string) {
    setFilters((current) => ({
      ...current,
      universityTypeId: value ? Number(value) : undefined,
    }));
  }

  function handleStatusChange(value: string) {
    setFilters((current) => ({
      ...current,
      isActive:
        value === ""
          ? undefined
          : value === "active",
    }));
  }

  function handleParentChange(value: string) {
    setFilters((current) => ({
      ...current,
      parentUniversityId: value ? Number(value) : undefined,
    }));
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    await deleteUniversity(deleteTarget.id);

    toast.success("دانشگاه با موفقیت حذف شد.");

    setDeleteTarget(null);
    reload();
    reloadParents();
  }

  function handleSaved() {
    reload();
    reloadParents();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت دانشگاه‌ها
          </h1>

          <p className="text-sm text-muted-foreground">
            اطلاعات دانشگاه‌ها، ظرفیت مصوب و ساختار دانشگاه‌های مادر و زیرمجموعه را مدیریت کنید.
          </p>
        </div>

        <Can controller="Universities" action="Create">
          <Button
            onClick={handleCreate}
            className="w-full rounded-full sm:w-auto"
          >
            <Plus className="size-4" />
            افزودن دانشگاه
          </Button>
        </Can>
      </div>

      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Search className="size-4 text-muted-foreground" />
          جست‌وجو و فیلتر
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FormField
            id="university-search"
            label="نام دانشگاه"
            placeholder="جست‌وجوی نام دانشگاه"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="filter-university-type" className="text-sm font-medium">
              نوع دانشگاه
            </label>

            <select
              id="filter-university-type"
              value={filters.universityTypeId ?? ""}
              onChange={(event) => handleTypeChange(event.target.value)}
              disabled={codesLoading}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">همه انواع</option>

              {universityTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="filter-university-region" className="text-sm font-medium">
              منطقه
            </label>

            <select
              id="filter-university-region"
              value={filters.region ?? ""}
              onChange={(event) => handleRegionChange(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">همه مناطق</option>

              {Array.from({ length: 11 }, (_, index) => index + 1).map(
                (region) => (
                  <option key={region} value={region}>
                    منطقه {region}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="filter-university-parent" className="text-sm font-medium">
              دانشگاه مادر
            </label>

            <select
              id="filter-university-parent"
              value={filters.parentUniversityId ?? ""}
              onChange={(event) => handleParentChange(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">همه دانشگاه‌ها</option>

              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="filter-university-status" className="text-sm font-medium">
              وضعیت
            </label>

            <select
              id="filter-university-status"
              value={
                filters.isActive === undefined
                  ? ""
                  : filters.isActive
                    ? "active"
                    : "inactive"
              }
              onChange={(event) => handleStatusChange(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" className="rounded-full">
              <Search className="size-4" />
              جست‌وجو
            </Button>

            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSearchText("");
                setFilters({});
              }}
            >
              پاک‌کردن فیلترها
            </Button>
          </div>
        </form>
      </section>

      {loading && (
        <div className="rounded-2xl border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />

          <p className="text-sm text-muted-foreground">
            در حال دریافت اطلاعات دانشگاه‌ها...
          </p>
        </div>
      )}

      {!loading && failed && (
        <ErrorState
          title="دریافت اطلاعات دانشگاه‌ها ناموفق بود"
          description="ارتباط با سرور برقرار نشد یا امکان دریافت اطلاعات وجود ندارد."
          onRetry={reload}
        />
      )}

      {!loading && !failed && universities.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              تعداد نتایج:{" "}
              <span className="font-semibold text-foreground">
                {universities.length.toLocaleString("fa-IR")}
              </span>
            </p>
          </div>

          <UniversitiesTable
            universities={universities}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      {!loading && !failed && universities.length === 0 && (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="دانشگاهی پیدا نشد"
          description="با فیلترهای فعلی دانشگاهی وجود ندارد. می‌توانید فیلترها را تغییر دهید یا دانشگاه جدیدی ثبت کنید."
          action={
            <Can controller="Universities" action="Create">
              <Button
                onClick={handleCreate}
                className="rounded-full"
              >
                <Plus className="size-4" />
                ثبت دانشگاه جدید
              </Button>
            </Can>
          }
        />
      )}

      <UniversityFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        university={editingUniversity}
        universities={parentOptions}
        universityTypes={universityTypes}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف دانشگاه"
        description={
          deleteTarget
            ? `آیا از حذف «${deleteTarget.title}» اطمینان دارید؟ در صورت داشتن زیرمجموعه یا اطلاعات وابسته، Backend اجازه حذف نخواهد داد.`
            : ""
        }
        confirmLabel="حذف دانشگاه"
        onConfirm={handleDelete}
      />
    </div>
  );
}

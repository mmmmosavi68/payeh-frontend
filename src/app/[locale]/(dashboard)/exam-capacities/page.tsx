
import { setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { ExamCapacityManager } from "@/features/exam-capacities/components/exam-capacity-manager";

export default async function ExamCapacitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="تعیین ظرفیت آزمون"
        description="مدیریت ظرفیت اختصاص‌یافته به آزمون‌ها برای دانشگاه‌های مجاز"
        crumbs={[{ label: "تعیین ظرفیت آزمون" }]}
      />

      <ExamCapacityManager />
    </>
  );
}

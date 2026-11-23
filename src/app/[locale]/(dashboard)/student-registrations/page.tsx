import { setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { StudentRegistrationManager } from "@/features/student-registrations/components/student-registration-manager";

export default async function StudentRegistrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="ثبت‌نام دانشجویان"
        description="مدیریت ثبت‌نام داوطلبان آزمون‌های دانشگاه"
        crumbs={[{ label: "ثبت‌نام دانشجویان" }]}
      />

      <StudentRegistrationManager />
    </>
  );
}
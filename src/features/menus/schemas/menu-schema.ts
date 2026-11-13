import { z } from "zod";

export const menuSchema = z.object({
  // اطلاعات اصلی
  menuTitle: z.string().trim().min(1, "عنوان منو الزامی است.").max(100, "عنوان منو نباید بیشتر از ۱۰۰ کاراکتر باشد."),

  parentId: z.preprocess((value) => (value === "" || value === undefined ? null : value), z.string().uuid("شناسه منوی والد معتبر نیست.").nullable()),

  pageCode: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }, z.number().int("ترتیب نمایش باید عدد صحیح باشد.").nullable()),

  // مسیریابی و مجوز
  path: z.string().trim().max(200, "مسیر نباید بیشتر از ۲۰۰ کاراکتر باشد."),

  link: z.string().trim().max(200, "لینک نباید بیشتر از ۲۰۰ کاراکتر باشد."),

  version: z.string().trim().max(100, "نسخه نباید بیشتر از ۱۰۰ کاراکتر باشد."),

  controllerName: z.string().trim().max(100, "نام کنترلر نباید بیشتر از ۱۰۰ کاراکتر باشد."),

  actionName: z.string().trim().max(100, "نام اکشن نباید بیشتر از ۱۰۰ کاراکتر باشد."),

  // تنظیمات نمایش
  icon: z.string().trim().max(100, "نام آیکون نباید بیشتر از ۱۰۰ کاراکتر باشد."),

  cssClass: z.string().trim().max(50, "کلاس CSS نباید بیشتر از ۵۰ کاراکتر باشد."),

  showMenu: z.boolean(),

  isActive: z.boolean(),
});

export type MenuFormInput = z.input<typeof menuSchema>;

export type MenuFormValues = z.output<typeof menuSchema>;

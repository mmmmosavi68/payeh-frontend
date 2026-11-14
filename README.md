# Payeh theme, palette and locale patch

این patch برای نسخه فعلی مخزن `mmmmosavi68/payeh-frontend` تهیه شده است.

## روش اجرا

1. از ریشه پروژه فرانت‌اند یک commit یا branch پشتیبان بساز:

   ```powershell
   git switch -c 6-ThemePaletteLocale
   ```

2. فایل `apply-theme-locale.mjs` را در ریشه پروژه قرار بده.
3. اجرا کن:

   ```powershell
   node .\apply-theme-locale.mjs
   ```

4. بررسی کن:

   ```powershell
   npm run typecheck
   npm run lint
   ```

5. بعد از بررسی ظاهری، تغییرات را commit کن.

## تغییرات

- حفظ پالت فعلی با شناسه `default`.
- افزودن پالت Indigo روشن و تاریک با ذخیره انتخاب در localStorage.
- اضافه شدن انتخاب پالت به سربرگ.
- تبدیل انتخاب تم به فهرست روشن / تاریک / مطابق سیستم.
- تبدیل تغییر زبان به فهرست انتخاب زبان‌های فعال در `src/i18n/routing.ts`.
- افزودن `ThemeSync` برای بازاعمال تم ذخیره‌شده هنگام تغییر زبان.
- افزودن `PaletteInitializer` برای حفظ پالت در همه صفحات و پس از تغییر زبان.
- بدون افزودن وابستگی جدید.

## افزودن زبان جدید در آینده

در `src/i18n/routing.ts` یک گزینه به `localeOptions` اضافه کن، فایل ترجمه متناظر را در `messages` بساز و جهت `rtl` یا `ltr` را مشخص کن. فهرست انتخاب زبان به صورت خودکار از همین آرایه ساخته می‌شود.

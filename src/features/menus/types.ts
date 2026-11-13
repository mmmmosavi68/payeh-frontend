/**
 * اطلاعات یک منو که از API دریافت می‌شود.
 */
export interface MenuDto {
  id: string;
  parentId: string | null;

  menuTitle: string;
  pageCode: number | null;

  path: string | null;
  version: string | null;

  controllerName: string | null;
  actionName: string | null;

  showMenu: boolean | null;

  cssClass: string | null;
  icon: string | null;
  link: string | null;

  isActive: boolean;
}

/**
 * اطلاعات موردنیاز برای ایجاد منو.
 */
export interface CreateMenuDto {
  parentId: string | null;

  menuTitle: string;
  pageCode: number | null;

  path: string | null;
  version: string | null;

  controllerName: string | null;
  actionName: string | null;

  showMenu: boolean;

  cssClass: string | null;
  icon: string | null;
  link: string | null;

  isActive: boolean;
}

/**
 * اطلاعات موردنیاز برای ویرایش منو.
 */
export type UpdateMenuDto = CreateMenuDto;

/**
 * قرارداد عمومی پاسخ API پروژه.
 */
export interface ApiResult<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  data: T | null;
}

/**
 * وضعیت فرم افزودن یا ویرایش منو.
 */
export type MenuFormMode = "create" | "edit";

/**
 * اطلاعات اولیه فرم منو.
 * مقادیر متنی خالی هستند تا فرم برای ایجاد منوی جدید آماده باشد.
 */
export interface MenuFormDefaultValues {
  parentId: string | null;
  menuTitle: string;
  pageCode: number | null;

  path: string;
  version: string;

  controllerName: string;
  actionName: string;

  showMenu: boolean;

  cssClass: string;
  icon: string;
  link: string;

  isActive: boolean;
}

import { readFileSync, writeFileSync } from "node:fs";

const fa = {
  title: "کاربران",
  description: "مدیریت کاربران و حساب‌های سامانه",
  add: "افزودن کاربر",
  searchPlaceholder: "جستجو بر اساس نام، نام کاربری، موبایل یا ایمیل",
  never: "هنوز وارد نشده",
  filters: {
    status: "وضعیت",
    all: "همه",
    active: "فعال",
    inactive: "غیرفعال",
    role: "نقش",
    allRoles: "همه‌ی نقش‌ها",
  },
  columns: {
    user: "کاربر",
    phone: "موبایل",
    roles: "نقش‌ها",
    status: "وضعیت",
    lastLogin: "آخرین ورود",
    createdAt: "تاریخ ایجاد",
    actions: "عملیات",
  },
  status: { active: "فعال", inactive: "غیرفعال" },
  pagination: {
    summary: "نمایش {from} تا {to} از {total} کاربر",
    page: "صفحه {page} از {pages}",
  },
  empty: {
    title: "کاربری پیدا نشد",
    description: "فیلترها را تغییر دهید یا کاربر جدیدی اضافه کنید.",
    clear: "پاک کردن فیلترها",
  },
  error: {
    title: "بارگذاری کاربران ناموفق بود",
    description: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.",
  },
  forbidden: {
    title: "دسترسی ندارید",
    description: "شما به مدیریت کاربران دسترسی ندارید. برای دریافت دسترسی با مدیر سیستم تماس بگیرید.",
  },
  form: {
    createTitle: "افزودن کاربر",
    createDescription: "اطلاعات کاربر جدید را وارد کنید.",
    editTitle: "ویرایش کاربر",
    editDescription: "نام کاربری و کد ملی بعد از ایجاد قابل تغییر نیستند.",
    username: "نام کاربری",
    firstName: "نام",
    lastName: "نام خانوادگی",
    phone: "شماره موبایل",
    email: "ایمیل (اختیاری)",
    nationalCode: "کد ملی",
    password: "رمز عبور (اختیاری)",
    passwordNew: "رمز عبور جدید (اختیاری)",
    passwordHintCreate: "ورود اصلی با کد پیامکی است؛ رمز فقط برای ورود با نام کاربری لازم است.",
    passwordHintEdit: "با تغییر رمز، همه‌ی نشست‌های این کاربر پایان می‌یابد.",
    roles: "نقش‌ها",
    rolesFailed: "بارگذاری نقش‌ها ناموفق بود.",
    isActive: "حساب کاربری فعال باشد",
    conflict: "نام کاربری، شماره موبایل یا کد ملی قبلاً ثبت شده است.",
    validation: {
      usernameFormat: "نام کاربری باید ۳ تا ۵۰ کاراکتر باشد، با حرف انگلیسی شروع شود و فقط حروف، عدد، نقطه و زیرخط داشته باشد",
      firstNameRequired: "نام را وارد کنید",
      lastNameRequired: "نام خانوادگی را وارد کنید",
      phoneInvalid: "شماره موبایل معتبر نیست (مثال: 09123456789)",
      emailInvalid: "ایمیل معتبر نیست",
      nationalCodeInvalid: "کد ملی باید ۱۰ رقم باشد",
      passwordMin: "رمز عبور حداقل ۸ کاراکتر باشد",
      rolesRequired: "حداقل یک نقش انتخاب کنید",
    },
  },
  delete: {
    title: "حذف کاربر",
    description: "آیا از حذف «{name}» مطمئن هستید؟ نشست‌های او نیز پایان می‌یابد.",
    confirm: "بله، حذف شود",
  },
  toast: {
    created: "کاربر ایجاد شد",
    updated: "کاربر ویرایش شد",
    deleted: "کاربر حذف شد",
  },
};

const en = {
  title: "Users",
  description: "Manage system users and accounts",
  add: "Add user",
  searchPlaceholder: "Search by name, username, phone or email",
  never: "Never signed in",
  filters: {
    status: "Status",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    role: "Role",
    allRoles: "All roles",
  },
  columns: {
    user: "User",
    phone: "Phone",
    roles: "Roles",
    status: "Status",
    lastLogin: "Last sign-in",
    createdAt: "Created",
    actions: "Actions",
  },
  status: { active: "Active", inactive: "Inactive" },
  pagination: {
    summary: "Showing {from} to {to} of {total} users",
    page: "Page {page} of {pages}",
  },
  empty: {
    title: "No users found",
    description: "Change the filters or add a new user.",
    clear: "Clear filters",
  },
  error: {
    title: "Failed to load users",
    description: "Could not reach the server. Please try again.",
  },
  forbidden: {
    title: "Access denied",
    description: "You do not have access to user management. Contact your administrator to request access.",
  },
  form: {
    createTitle: "Add user",
    createDescription: "Enter the details of the new user.",
    editTitle: "Edit user",
    editDescription: "The username and national code cannot be changed after creation.",
    username: "Username",
    firstName: "First name",
    lastName: "Last name",
    phone: "Mobile number",
    email: "Email (optional)",
    nationalCode: "National code",
    password: "Password (optional)",
    passwordNew: "New password (optional)",
    passwordHintCreate: "Signing in is mainly done with an SMS code; a password is only needed for username sign-in.",
    passwordHintEdit: "Changing the password ends all of this user's sessions.",
    roles: "Roles",
    rolesFailed: "Could not load the roles.",
    isActive: "Account is active",
    conflict: "The username, mobile number or national code is already registered.",
    validation: {
      usernameFormat: "The username must be 3 to 50 characters, start with a Latin letter and contain only letters, digits, dots and underscores",
      firstNameRequired: "Enter the first name",
      lastNameRequired: "Enter the last name",
      phoneInvalid: "Invalid mobile number (e.g. 09123456789)",
      emailInvalid: "Invalid email address",
      nationalCodeInvalid: "The national code must be 10 digits",
      passwordMin: "Password must be at least 8 characters",
      rolesRequired: "Select at least one role",
    },
  },
  delete: {
    title: "Delete user",
    description: "Are you sure you want to delete “{name}”? Their sessions will also end.",
    confirm: "Yes, delete",
  },
  toast: {
    created: "User created",
    updated: "User updated",
    deleted: "User deleted",
  },
};

for (const [locale, users] of [
  ["fa", fa],
  ["en", en],
]) {
  const file = new URL(`../messages/${locale}.json`, import.meta.url);
  const messages = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  messages.users = users;
  writeFileSync(file, JSON.stringify(messages, null, 2) + "\n", "utf8");
  console.log(`OK  messages/${locale}.json -> users`);
}

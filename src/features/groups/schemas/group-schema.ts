import { z } from "zod";

export const groupSchema = z.object({
  groupName: z.string().trim().min(1, "عنوان گروه الزامی است.").max(100, "عنوان گروه نباید بیش از ۱۰۰ کاراکتر باشد."),
  isActive: z.boolean(),
});

export type GroupFormInput = z.input<typeof groupSchema>;
export type GroupFormValues = z.output<typeof groupSchema>;

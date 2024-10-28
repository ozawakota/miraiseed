import { z } from "zod";

export const productSchema = z
  .object({
    sku: z.string().regex(/^[A-Z]{3}-\d{4}$/),
    price: z.number().int().positive(),
    expirationDate: z
      .string()
      .date()
      .refine((date) => new Date(date) > new Date(), {
        message: "有効期限は未来の日付にしなければいけません"
      }),
  })
  .strict()
  .brand<"Product">();
  ;


// Zodのスキーマから型を生成する
export type ProductType = z.infer<typeof productSchema>;


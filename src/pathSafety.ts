import { z } from "zod";

const UnsafePathChars = /[/?#\\%&]/;
const AllowedResourceIdChars = /^[A-Za-z0-9._:-]+$/;

export const ResourceIdSchema = z
  .string()
  .min(1)
  .max(128)
  .refine((value) => AllowedResourceIdChars.test(value), {
    message: "id contains unsupported characters",
  })
  .refine((value) => !value.includes(".."), {
    message: "id must not contain '..'",
  })
  .refine((value) => !UnsafePathChars.test(value), {
    message: "id must not include path separators, query, fragment, or encoded delimiters",
  });

export function toSafePathSegment(id: string): string {
  return encodeURIComponent(ResourceIdSchema.parse(id));
}

export function buildResourcePath(basePath: string, id: string): string {
  return `${basePath}/${toSafePathSegment(id)}`;
}

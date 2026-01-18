import { z } from 'zod';

export const updateCompanySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    taxId: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(1).optional(),
    website: z.string().trim().min(1).optional(),
    sector: z.string().trim().min(1).optional(),
    employeeCount: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

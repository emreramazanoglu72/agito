import { z } from 'zod';

export const createEmployeeSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    tcNo: z.string().trim().min(1),
    companyId: z.string().trim().min(1),
    departmentId: z.string().trim().min(1).optional(),
    birthDate: z.coerce.date().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().trim().min(1).optional(),
  })
  .strict();

export const updateEmployeeSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    tcNo: z.string().trim().min(1).optional(),
    departmentId: z.string().trim().min(1).optional(),
    birthDate: z.coerce.date().optional(),
    avatarUrl: z.string().trim().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().trim().min(1).optional(),
  })
  .strict();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

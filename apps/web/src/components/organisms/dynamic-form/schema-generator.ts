import { z } from 'zod';
import { FieldSchema, ValidationRules } from './types';

export const generateZodSchema = (fields: FieldSchema[]) => {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    fields.forEach((field) => {
        let validator: z.ZodTypeAny = z.any();
        const rules = field.validation || {};
        const label = field.label || field.name;

        // Base type validation
        if (field.type === 'number') {
            validator = z.coerce.number();
        } else if (field.type === 'checkbox') {
            validator = z.boolean();
        } else if (field.type === 'date') {
            validator = z.date();
        } else if (field.type === 'file-upload') {
            if (field.uploadConfig?.variant === 'avatar') {
                validator = z.string();
            } else {
                validator = z.array(z.any());
            }
        } else {
            validator = z.string();
        }

        // Apply rules
        // 1. Required
        if (rules.required) {
            const msg = typeof rules.required === 'string' ? rules.required : `${label} zorunludur`;
            if (field.type === 'checkbox') {
                // For checkbox, "required" usually means must be true
                validator = (validator as z.ZodBoolean).refine(val => val === true, { message: msg });
            } else if (field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'password') {
                validator = (validator as z.ZodString).min(1, { message: msg });
            } else {
                // For number/date/select, just ensure it's not null/undefined
                // Zod handles type checks, but we might need pipe/refine for nulls if optional wasn't set
            }
        } else {
            // If not required, it should be optional
            validator = validator.optional().or(z.literal(''));
        }

        // 2. Min/Max Length (String)
        if (field.type !== 'number' && field.type !== 'checkbox' && field.type !== 'date') {
            if (rules.minLength) {
                const val = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
                const msg = typeof rules.minLength === 'object' ? rules.minLength.message : `${label} en az ${val} karakter olmalıdır`;
                validator = (validator as z.ZodString).min(val, { message: msg });
            }
            if (rules.maxLength) {
                const val = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
                const msg = typeof rules.maxLength === 'object' ? rules.maxLength.message : `${label} en fazla ${val} karakter olabilir`;
                validator = (validator as z.ZodString).max(val, { message: msg });
            }
            if (rules.email) {
                const msg = typeof rules.email === 'string' ? rules.email : `Geçerli bir e-posta adresi giriniz`;
                validator = (validator as z.ZodString).email({ message: msg });
            }
        }

        // 3. Min/Max Value (Number)
        if (field.type === 'number') {
            if (rules.min) {
                const val = typeof rules.min === 'number' ? rules.min : rules.min.value;
                const msg = typeof rules.min === 'object' ? rules.min.message : `${label} en az ${val} olmalıdır`;
                validator = (validator as z.ZodNumber).min(val, { message: msg });
            }
            if (rules.max) {
                const val = typeof rules.max === 'number' ? rules.max : rules.max.value;
                const msg = typeof rules.max === 'object' ? rules.max.message : `${label} en fazla ${val} olabilir`;
                validator = (validator as z.ZodNumber).max(val, { message: msg });
            }
        }

        schemaShape[field.name] = validator;
    });

    return z.object(schemaShape);
};

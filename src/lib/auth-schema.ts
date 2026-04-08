import { z } from "zod";

import { isValidMoroccanPhone } from "@/lib/phone";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "Mot de passe invalide"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(120, "Le nom est trop long"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  phone: z
    .string()
    .trim()
    .min(1, "Numéro de téléphone requis")
    .refine((value) => isValidMoroccanPhone(value), "Numéro de téléphone invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),
});

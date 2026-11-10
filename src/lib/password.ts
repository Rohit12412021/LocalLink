export type PasswordStrength = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

export function evaluatePassword(password: string): PasswordStrength {
  return {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  return Object.values(evaluatePassword(password)).every(Boolean);
}

export const passwordRules: { key: keyof PasswordStrength; label: string }[] = [
  { key: "length", label: "At least 12 characters" },
  { key: "uppercase", label: "An uppercase letter" },
  { key: "lowercase", label: "A lowercase letter" },
  { key: "number", label: "A number" },
  { key: "special", label: "A special character (@$!%*?&)" },
];
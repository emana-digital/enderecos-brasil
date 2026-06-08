/** Formata um CEP de 8 dígitos para `01310-100`. Passa direto se não tiver 8. */
export const maskCep = (cep: string): string => {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : cep;
};

/** Mantém só os dígitos do CEP (formato usado nos campos de dado da API). */
export const unmaskCep = (cep: string): string => cep.replace(/\D/g, "");

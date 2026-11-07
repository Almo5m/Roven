/* Phone numbers: accept Arabic-Indic (٠١٢…) and Persian digits, spaces, dashes and brackets, because Arabic keyboards type those. */
const AR = '٠١٢٣٤٥٦٧٨٩', FA = '۰۱۲۳۴۵۶۷۸۹';
export const normPhone = s => String(s).replace(/[٠-٩۰-۹]/g, c => String(AR.indexOf(c) >= 0 ? AR.indexOf(c) : FA.indexOf(c))).replace(/[\s\-().]/g, '');
export const isPhone = s => /^\+?\d{10,14}$/.test(normPhone(s));

/* Transfer methods the owner can pick from in the dashboard. */
export const KINDS = [
  { k: 'instapay', ar: 'إنستا باي', en: 'InstaPay' }, { k: 'vodafone', ar: 'فودافون كاش', en: 'Vodafone Cash' },
  { k: 'etisalat', ar: 'اتصالات كاش', en: 'Etisalat Cash' }, { k: 'orange', ar: 'أورنج كاش', en: 'Orange Cash' },
  { k: 'bank', ar: 'تحويل بنكي', en: 'Bank transfer' }, { k: 'other', ar: 'أخرى', en: 'Other' },
];
export const kindLabel = (m, lang) => m.kind === 'other' ? (m.label || '—') : (KINDS.find(k => k.k === m.kind)?.[lang] || m.kind);

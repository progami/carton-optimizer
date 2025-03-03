// src/utils/formatters.ts
export const formatCurrency = (num) => {
  return `£${num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};

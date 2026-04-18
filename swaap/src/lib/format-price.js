/** Display prices in Saudi Riyal (stored amounts are numeric SAR). */
export function formatEventPrice(price) {
  if (price === 0 || price == null) return "Free";
  const n = Number(price);
  if (Number.isNaN(n)) return "Free";
  return `${n.toLocaleString("en-SA", { maximumFractionDigits: 2 })} SAR`;
}

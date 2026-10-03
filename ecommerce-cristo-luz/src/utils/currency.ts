export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const withThousands = rounded.toLocaleString("es-PY");
  return `Gs. ${withThousands}`;
}

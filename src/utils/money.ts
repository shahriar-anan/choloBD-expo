export function formatBdt(amount: number): string {
  const rounded = Math.round(amount);
  const grouped = rounded.toLocaleString('en-US');
  return `BDT ${grouped}`;
}

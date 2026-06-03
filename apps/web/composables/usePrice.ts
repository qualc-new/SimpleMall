export function usePrice() {
  const format = (cents: number) => `¥${(cents / 100).toFixed(2)}`;
  return { format };
}

/**
 * Standalone Utility Formatters for Importaciones App
 */

export function formatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

export function formatNum(n: number): string {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatShort(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + 'B';
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M';
  }
  if (n >= 1_000) {
    return (n / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'K';
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function truncateDesc(desc: string, maxLen = 50): string {
  if (!desc) return '';
  const formatted = formatTitleCase(desc);
  return formatted.length > maxLen ? formatted.substring(0, maxLen) + '...' : formatted;
}

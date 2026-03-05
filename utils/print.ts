interface PrintWindowOptions {
  width?: number;
  height?: number;
}

export const openPrintWindow = (html: string, options: PrintWindowOptions = {}) => {
  if (typeof window === 'undefined') return false;

  const width = options.width || 900;
  const height = options.height || 600;
  const printWindow = window.open('', '_blank', `width=${width},height=${height}`);

  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};

export function isWindowsProcessName(value: string): boolean {
  return (
    /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,99}$/.test(value) &&
    !/[\r\n]/.test(value) &&
    !value.includes("..") &&
    !/\.exe$/i.test(value)
  );
}

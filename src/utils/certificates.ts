export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `QM-${timestamp}-${random}`.toUpperCase();
}
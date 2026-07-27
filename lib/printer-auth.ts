import crypto from "crypto";

export function isPrinterRequestAuthorized(request: Request) {
  const expectedKey = process.env.PRINTER_API_KEY || "";
  const receivedKey = request.headers.get("x-printer-key") || "";

  if (!expectedKey || !receivedKey) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const receivedBuffer = Buffer.from(receivedKey);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

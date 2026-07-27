import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, ".env");
const logDirectory = path.join(__dirname, "logs");
const temporaryDirectory = path.join(__dirname, "temp");

fs.mkdirSync(logDirectory, { recursive: true });
fs.mkdirSync(temporaryDirectory, { recursive: true });

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const websiteUrl = String(process.env.WEBSITE_URL || "").replace(/\/$/, "");
const printerApiKey = String(process.env.PRINTER_API_KEY || "");
const printerName = String(process.env.PRINTER_NAME || "CITIZEN CT-D150");
const pollIntervalMs = Math.max(
  Number(process.env.POLL_INTERVAL_MS || 5000),
  2000
);

function log(message, error) {
  const line = `[${new Date().toISOString()}] ${message}${
    error ? ` ${error instanceof Error ? error.stack || error.message : String(error)}` : ""
  }`;

  console.log(line);
  fs.appendFileSync(path.join(logDirectory, "printer-agent.log"), `${line}\n`);
}

function requireConfiguration() {
  const missing = [];

  if (!websiteUrl) missing.push("WEBSITE_URL");
  if (!printerApiKey) missing.push("PRINTER_API_KEY");
  if (!printerName) missing.push("PRINTER_NAME");

  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(", ")} in printer-agent/.env. Copy .env.example to .env and fill it.`
    );
  }
}

const ESC = 0x1b;
const GS = 0x1d;
const RECEIPT_WIDTH = 42;

function ascii(value) {
  return String(value ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function center(value, width = RECEIPT_WIDTH) {
  const text = ascii(value).slice(0, width);
  const left = Math.max(Math.floor((width - text.length) / 2), 0);
  return `${" ".repeat(left)}${text}`;
}

function padRight(value, width) {
  const text = ascii(value).slice(0, width);
  return text.padEnd(width, " ");
}

function padLeft(value, width) {
  const text = ascii(value).slice(0, width);
  return text.padStart(width, " ");
}

function line(character = "-") {
  return character.repeat(RECEIPT_WIDTH);
}

function wrap(value, width = RECEIPT_WIDTH) {
  const text = ascii(value).trim();
  if (!text) return [];

  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }

      for (let index = 0; index < word.length; index += width) {
        lines.push(word.slice(index, index + width));
      }

      continue;
    }

    const next = current ? `${current} ${word}` : word;

    if (next.length <= width) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function inclusiveGst(amount, gstPercent) {
  return amount - amount / (1 + gstPercent / 100);
}

function formatIndianDateTime(value) {
  const date = new Date(value);

  return {
    date: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function formatDateOnly(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

class EscPosReceipt {
  constructor() {
    this.parts = [];
  }

  bytes(...values) {
    this.parts.push(Buffer.from(values));
    return this;
  }

  text(value = "") {
    this.parts.push(Buffer.from(ascii(value), "ascii"));
    return this;
  }

  newline(count = 1) {
    this.text("\n".repeat(count));
    return this;
  }

  align(mode) {
    const values = { left: 0, center: 1, right: 2 };
    return this.bytes(ESC, 0x61, values[mode] ?? 0);
  }

  bold(enabled) {
    return this.bytes(ESC, 0x45, enabled ? 1 : 0);
  }

  size(widthMultiplier = 1, heightMultiplier = 1) {
    const width = Math.max(1, Math.min(widthMultiplier, 8)) - 1;
    const height = Math.max(1, Math.min(heightMultiplier, 8)) - 1;
    return this.bytes(GS, 0x21, (width << 4) | height);
  }

  initialize() {
    this.bytes(ESC, 0x40);
    this.bytes(ESC, 0x33, 24);
    this.newline();
    return this;
  }

  cut() {
    this.newline(3);
    this.bytes(GS, 0x56, 0x00);
    return this;
  }

  build() {
    return Buffer.concat(this.parts);
  }
}

function addCommonHeader(receipt, title) {
  receipt.align("center").bold(true).size(2, 2).text("Adams Elite").newline();
  receipt.size(1, 1).bold(true);
  receipt.text("Old No.144, New No.61, L.B ROAD").newline();
  receipt.text("ADYAR, Chennai - 600 020").newline();
  receipt.bold(false).text("Ph: 044-47905577").newline();
  receipt.text("WhatsApp: 9840905577").newline();
  receipt.text("Instagram: chennai_adams_collection").newline();
  receipt.bold(true).text("GSTN 33ALSPJ7520P1ZI").newline();
  receipt.text(title).newline();
  receipt.bold(false).align("left").text(line()).newline();
}

function buildOrderReceipt(order) {
  const receipt = new EscPosReceipt().initialize();
  const created = formatIndianDateTime(order.created_at);
  const items = Array.isArray(order.items) ? order.items : [];

  addCommonHeader(receipt, "ONLINE BILL");

  receipt.bold(true).text(`Bill No : OL${String(order.id).padStart(4, "0")}`).newline();
  receipt.bold(false).text(`Date    : ${created.date}  ${created.time}`).newline();
  receipt.text(`Name    : ${ascii(order.customer_name)}`).newline();
  receipt.text(`Phone   : ${ascii(order.customer_phone)}`).newline();

  for (const addressLine of wrap(`Address : ${order.customer_address || "Not provided"}`)) {
    receipt.text(addressLine).newline();
  }

  receipt.text(line()).newline();
  receipt.bold(true);
  receipt
    .text(
      `${padRight("Particulars", 18)}${padLeft("Qty", 4)}${padLeft("Rate", 9)}${padLeft("Amount", 11)}`
    )
    .newline();
  receipt.bold(false).text(line(".")).newline();

  let totalQty = 0;
  const taxGroups = new Map();

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const amount = price * quantity;
    const gstPercent = Number(item.gstPercent ?? item.gst_percent ?? 3);
    const gstAmount = inclusiveGst(amount, gstPercent);
    const nameLines = wrap(item.name || "Product", 18);

    totalQty += quantity;
    taxGroups.set(gstPercent, (taxGroups.get(gstPercent) || 0) + gstAmount);

    receipt
      .text(
        `${padRight(nameLines[0] || "Product", 18)}${padLeft(quantity, 4)}${padLeft(
          money(price),
          9
        )}${padLeft(money(amount), 11)}`
      )
      .newline();

    for (const extraLine of nameLines.slice(1)) {
      receipt.text(padRight(extraLine, 18)).newline();
    }
  }

  receipt.text(line()).newline();
  receipt.text(`Total Items : ${items.length}`).newline();
  receipt.text(`Total Qty   : ${totalQty}`).newline();

  const totalGst = [...taxGroups.values()].reduce((sum, value) => sum + value, 0);

  receipt.text(`Gross Amt   : Rs.${money(order.total)}`).newline();
  receipt.text(`Total GST   : Rs.${money(totalGst)}`).newline();
  receipt.bold(true).size(2, 2).align("center");
  receipt.text(`TOTAL: ${money(order.total)}`).newline();
  receipt.size(1, 1).bold(false).align("left");

  receipt.text(line()).newline();
  receipt.bold(true).text("Tax Details").newline();
  receipt.bold(false);
  receipt.text(`${padLeft("GST%", 6)}${padLeft("SGST", 12)}${padLeft("CGST", 12)}${padLeft("TOTAL", 12)}`).newline();

  for (const [gstPercent, gstAmount] of taxGroups.entries()) {
    receipt
      .text(
        `${padLeft(money(gstPercent), 6)}${padLeft(money(gstAmount / 2), 12)}${padLeft(
          money(gstAmount / 2),
          12
        )}${padLeft(money(gstAmount), 12)}`
      )
      .newline();
  }

  receipt.text(line()).newline();
  receipt.bold(true).text("Payment Details").newline();
  receipt.bold(false);
  receipt.text(`Online Sale : Rs.${money(order.payment_amount || order.total)}`).newline();
  receipt.text(`Payment ID  : ${ascii(order.razorpay_payment_id || "-")}`).newline();

  if (order.notes) {
    receipt.text(line()).newline();
    receipt.bold(true).text("Notes").newline().bold(false);
    for (const noteLine of wrap(order.notes)) {
      receipt.text(noteLine).newline();
    }
  }

  receipt.text(line()).newline();
  receipt.bold(true);
  for (const termLine of [
    "EXCHANGE WITHIN TWO DAYS ONLY!",
    "NO EXCHANGE/GUARANTEE FOR TOYS,",
    "COSMETICS, THREAD AND GLASS BANGLES!",
    "WITHOUT PURCHASE BILL NO CASH REFUND",
  ]) {
    for (const wrapped of wrap(termLine)) {
      receipt.text(wrapped).newline();
    }
  }

  receipt.text(line()).newline();
  receipt.align("center").text("THANK YOU!!! VISIT AGAIN!!!").newline();
  receipt.text("HAVE A NICE DAY!!!").newline();
  receipt.bold(false).cut();

  return receipt.build();
}

function buildRentalReceipt(order) {
  const receipt = new EscPosReceipt().initialize();
  const created = formatIndianDateTime(order.created_at);
  const rentalAmount = Number(order.rental_amount || 0);
  const advanceAmount = Number(order.advance_amount || 0);
  const balance = Math.max(rentalAmount - advanceAmount, 0);

  addCommonHeader(receipt, "RENTAL BILL");

  receipt.bold(true).text(`Bill No : RN${String(order.id).padStart(4, "0")}`).newline();
  receipt.bold(false).text(`Date    : ${created.date}  ${created.time}`).newline();
  receipt.text(`Name    : ${ascii(order.customer_name)}`).newline();
  receipt.text(`Phone   : ${ascii(order.customer_phone)}`).newline();
  receipt.text(`Alt Ph  : ${ascii(order.alternate_phone || "-")}`).newline();
  receipt.text(`Rent    : ${formatDateOnly(order.rent_date)}`).newline();
  receipt.text(`Return  : ${formatDateOnly(order.return_date)}`).newline();
  receipt.text(`ID Proof: ${ascii(order.id_proof_type || "-")}`).newline();

  receipt.text(line()).newline();
  receipt.bold(true).text("Rental Product").newline().bold(false);
  for (const productLine of wrap(order.product_name || "Rental Product")) {
    receipt.text(productLine).newline();
  }

  receipt.text(line()).newline();
  receipt.text(`Rental Amount : Rs.${money(rentalAmount)}`).newline();
  receipt.text(`Advance Paid  : Rs.${money(advanceAmount)}`).newline();
  receipt.text(`Balance       : Rs.${money(balance)}`).newline();
  receipt.bold(true).size(2, 2).align("center");
  receipt.text(`TOTAL: ${money(rentalAmount)}`).newline();
  receipt.size(1, 1).bold(false).align("left");

  receipt.text(line()).newline();
  receipt.bold(true).text("Payment Details").newline().bold(false);
  receipt.text(`Online Sale : Rs.${money(order.payment_amount || advanceAmount)}`).newline();
  receipt.text(`Payment ID  : ${ascii(order.razorpay_payment_id || "-")}`).newline();

  if (order.notes) {
    receipt.text(line()).newline();
    receipt.bold(true).text("Notes").newline().bold(false);
    for (const noteLine of wrap(order.notes)) {
      receipt.text(noteLine).newline();
    }
  }

  receipt.text(line()).newline();
  receipt.bold(true);
  for (const term of [
    "RENTAL ITEMS MUST BE RETURNED ON RETURN DATE.",
    "DAMAGES OR MISSING ITEMS WILL BE CHARGED.",
    "ID PROOF IS REQUIRED FOR RENTAL CONFIRMATION.",
    "NO CASH REFUND WITHOUT BILL.",
  ]) {
    for (const termLine of wrap(term)) {
      receipt.text(termLine).newline();
    }
  }

  receipt.text(line()).newline();
  receipt.align("center").text("THANK YOU!!! VISIT AGAIN!!!").newline();
  receipt.text("HAVE A NICE DAY!!!").newline();
  receipt.bold(false).cut();

  return receipt.build();
}

function printRawFile(filePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "print-raw.ps1");
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-PrinterName",
        printerName,
        "-FilePath",
        filePath,
      ],
      {
        windowsHide: true,
      }
    );

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 && output.includes("PRINT_OK")) {
        resolve();
        return;
      }

      reject(
        new Error(
          errorOutput.trim() || output.trim() || `Printer command exited with code ${code}.`
        )
      );
    });
  });
}

async function claimJob() {
  const response = await fetch(`${websiteUrl}/api/printer/claim`, {
    method: "POST",
    headers: {
      "x-printer-key": printerApiKey,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Claim request failed with ${response.status}.`);
  }

  return result.job || null;
}

async function completeJob(jobId, success, error = "") {
  const response = await fetch(`${websiteUrl}/api/printer/complete`, {
    method: "POST",
    headers: {
      "x-printer-key": printerApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobId,
      success,
      error,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Complete request failed with ${response.status}.`);
  }
}

async function printJob(job) {
  const receipt =
    job.type === "rental"
      ? buildRentalReceipt(job.record)
      : buildOrderReceipt(job.record);

  const filePath = path.join(
    temporaryDirectory,
    `${job.type}-${job.recordId}-job-${job.id}.bin`
  );

  fs.writeFileSync(filePath, receipt);

  try {
    await printRawFile(filePath);
  } finally {
    fs.rmSync(filePath, { force: true });
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runTestPrint() {
  const sampleOrder = {
    id: 9999,
    created_at: new Date().toISOString(),
    customer_name: "Printer Test",
    customer_phone: "9999999999",
    customer_address: "Adams Elite shop printer test",
    notes: "This is a test bill. No real order was created.",
    items: [
      {
        id: 1,
        name: "Test Jewellery Product",
        quantity: 1,
        price: 100,
        gstPercent: 3,
      },
    ],
    total: 100,
    payment_amount: 100,
    razorpay_payment_id: "TEST-PAYMENT",
  };

  const filePath = path.join(temporaryDirectory, "printer-test.bin");
  fs.writeFileSync(filePath, buildOrderReceipt(sampleOrder));

  try {
    log(`Sending test receipt to ${printerName}...`);
    await printRawFile(filePath);
    log("Test receipt printed successfully.");
  } finally {
    fs.rmSync(filePath, { force: true });
  }
}

async function runAgent() {
  requireConfiguration();
  log(`Printer agent started. Website: ${websiteUrl}; Printer: ${printerName}`);

  while (true) {
    try {
      const job = await claimJob();

      if (!job) {
        await sleep(pollIntervalMs);
        continue;
      }

      log(`Claimed ${job.type} print job ${job.id} for record ${job.recordId}.`);

      try {
        await printJob(job);
        await completeJob(job.id, true);
        log(`Printed ${job.type} #${job.recordId} successfully.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        try {
          await completeJob(job.id, false, message);
        } catch (completeError) {
          log(`Could not mark failed print job ${job.id}.`, completeError);
        }

        log(`Printing ${job.type} #${job.recordId} failed.`, error);
      }
    } catch (error) {
      log("Printer agent polling error.", error);
      await sleep(Math.max(pollIntervalMs, 10000));
    }
  }
}

if (process.argv.includes("--test")) {
  requireConfiguration();
  runTestPrint().catch((error) => {
    log("Test print failed.", error);
    process.exitCode = 1;
  });
} else {
  runAgent().catch((error) => {
    log("Printer agent stopped unexpectedly.", error);
    process.exitCode = 1;
  });
}

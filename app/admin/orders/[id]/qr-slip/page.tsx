import QRCode from "qrcode";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PrintQrSlipButton from "@/components/admin/PrintQrSlipButton";

interface OrderQrSlipPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface QrSlipItem {
  productName: string;
  qrCode: string;
  qrImage: string;
}

const LABELS_PER_PAGE = 6;

async function getProductQrCodes(productIds: number[]) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, barcode")
    .in("id", productIds);

  if (error) {
    console.error("QR slip product fetch error:", error.message);
    return new Map<number, string>();
  }

  const qrMap = new Map<number, string>();

  for (const product of data || []) {
    qrMap.set(product.id, product.barcode || "");
  }

  return qrMap;
}

async function createQrSlipItems(orderId: number): Promise<QrSlipItem[]> {
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const productIds = order.items.map((item) => item.id);
  const qrMap = await getProductQrCodes(productIds);

  const slipItems: QrSlipItem[] = [];

  for (const item of order.items) {
    const qrCode = qrMap.get(item.id) || "";

    if (!qrCode) {
      continue;
    }

    const qrImage = await QRCode.toDataURL(qrCode, {
      margin: 2,
      width: 180,
      errorCorrectionLevel: "H",
    });

    for (let count = 0; count < item.quantity; count += 1) {
      slipItems.push({
        productName: item.name,
        qrCode,
        qrImage,
      });
    }
  }

  return slipItems;
}

function splitIntoPages<T>(items: T[], itemsPerPage: number): T[][] {
  const pages: T[][] = [];

  for (let index = 0; index < items.length; index += itemsPerPage) {
    pages.push(items.slice(index, index + itemsPerPage));
  }

  return pages;
}

export default async function OrderQrSlipPage({
  params,
}: OrderQrSlipPageProps) {
  const { id } = await params;
  const orderId = Number(id);

  if (!orderId || Number.isNaN(orderId)) {
    notFound();
  }

  const slipItems = await createQrSlipItems(orderId);
  const pages = splitIntoPages(slipItems, LABELS_PER_PAGE);

  return (
    <main className="qr-main min-h-screen bg-white px-4 py-6 text-black">
      <style>
        {`
          @page {
            size: 70mm 130mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          .qr-print-pages {
            width: 70mm;
            margin: 0 auto;
          }

          .qr-sheet {
            width: 70mm;
            height: 130mm;
            padding: 2mm;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 1.5mm;
            background: white;
            overflow: hidden;
          }

          .qr-label {
            min-width: 0;
            min-height: 0;
            border: 1px dashed black;
            padding: 1.5mm 1mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            overflow: hidden;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .qr-product-name {
            width: 100%;
            min-height: 7mm;
            max-height: 7mm;
            margin: 0 0 1mm;
            overflow: hidden;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8px;
            font-weight: 700;
            line-height: 1.1;
            text-align: center;
            overflow-wrap: anywhere;
          }

          .qr-image {
            display: block;
            width: 23mm;
            height: 23mm;
            flex-shrink: 0;
            object-fit: contain;
          }

          .qr-number {
            width: 100%;
            margin: 0.8mm 0 0;
            overflow: hidden;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7px;
            font-weight: 700;
            line-height: 1;
            text-align: center;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          @media print {
            html,
            body {
              width: 70mm !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: white !important;
            }

            .qr-main {
              width: 70mm !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .qr-print-pages {
              width: 70mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .qr-sheet {
              width: 70mm !important;
              height: 130mm !important;
              margin: 0 !important;
              padding: 2mm !important;
              page-break-after: always;
              break-after: page;
            }

            .qr-sheet:last-child {
              page-break-after: auto;
              break-after: auto;
            }
          }
        `}
      </style>

      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-2xl bg-[#F7F1E8] p-4">
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-stone-700 underline"
        >
          ← Back to Orders
        </Link>

        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-stone-700">
            {slipItems.length} QR label
            {slipItems.length === 1 ? "" : "s"}
          </p>

          <PrintQrSlipButton />
        </div>
      </div>

      {slipItems.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-2xl bg-red-50 p-6 text-center text-red-700">
          No QR codes found for this order. Check whether the barcode number is
          added in product admin.
        </div>
      ) : (
        <div className="qr-print-pages">
          {pages.map((pageItems, pageIndex) => (
            <section className="qr-sheet" key={`page-${pageIndex}`}>
              {pageItems.map((item, itemIndex) => (
                <article
                  className="qr-label"
                  key={`${item.qrCode}-${pageIndex}-${itemIndex}`}
                >
                  <p className="qr-product-name">{item.productName}</p>

                  <img
                    src={item.qrImage}
                    alt={`QR code for ${item.productName}`}
                    className="qr-image"
                  />

                  <p className="qr-number">{item.qrCode}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
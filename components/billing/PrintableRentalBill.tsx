"use client";

import { RentalOrder } from "@/data/rental-orders";

interface PrintableRentalBillProps {
  rentalOrder: RentalOrder;
}

function formatMoney(amount: number) {
  return amount.toFixed(2);
}

export default function PrintableRentalBill({
  rentalOrder,
}: PrintableRentalBillProps) {
  const billDate = new Date(rentalOrder.createdAt);

  const balanceAmount = Math.max(
    rentalOrder.rentalAmount - rentalOrder.advanceAmount,
    0
  );

  return (
    <main className="rental-bill-page min-h-screen bg-stone-100 px-4 py-8">
      <div className="no-print mx-auto mb-6 flex max-w-[360px] gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-stone-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white"
        >
          Print Bill
        </button>

        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-full border border-stone-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-950"
        >
          Back
        </button>
      </div>

      <section className="rental-receipt">
        <header className="rental-receipt-header">
          <h1>Adams Elite</h1>

          <p className="center bold">
            Old No. 144, New No.61, L.B ROAD, ADYAR
          </p>

          <p className="center">
            Chennai-600 020 &nbsp; Ph: 044-47905577
          </p>

          <p className="center">WhatsApp: 9840905577</p>

          <p className="center">
            Instagram: chennai_adams_collection
          </p>

          <p className="center bold">GSTN 33ALSPJ7520P1ZI</p>

          <h2>RENTAL BILL</h2>
        </header>

        <div className="rental-line" />

        <div className="rental-bill-grid">
          <div>
            <p>
              <b>NAME :</b> {rentalOrder.customerName}
            </p>

            <p>
              <b>PH&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</b>{" "}
              {rentalOrder.customerPhone}
            </p>
          </div>

          <div>
            <p>
              <b>Bill No :</b> RN
              {String(rentalOrder.id).padStart(4, "0")}
            </p>

            <p>
              <b>Date&nbsp;&nbsp;&nbsp;:</b>{" "}
              {billDate.toLocaleDateString("en-IN")}
            </p>

            <p>
              <b>Time&nbsp;&nbsp;&nbsp;:</b>{" "}
              {billDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="rental-line" />

        <div className="rental-date-details">
          <p>
            <b>Rent Date:</b>{" "}
            {new Date(rentalOrder.rentDate).toLocaleDateString("en-IN")}
          </p>

          <p>
            <b>Return Date:</b>{" "}
            {new Date(rentalOrder.returnDate).toLocaleDateString(
              "en-IN"
            )}
          </p>

          <p>
            <b>ID Proof:</b> {rentalOrder.idProofType}
          </p>
        </div>

        <div className="rental-line" />

        <table className="rental-items-table">
          <thead>
            <tr>
              <th className="left">Particulars</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="left">
                {rentalOrder.productName}
              </td>

              <td>1</td>

              <td>
                {formatMoney(rentalOrder.rentalAmount)}
              </td>

              <td>
                {formatMoney(rentalOrder.rentalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="rental-line" />

        <div className="rental-summary">
          <div>
            <p>
              <b>Total Items:</b> 1
            </p>

            <p>
              <b>Total Qty:</b> 1
            </p>
          </div>

          <div>
            <p>
              <b>Rental Amt :</b>{" "}
              {formatMoney(rentalOrder.rentalAmount)}
            </p>

            <p>
              <b>Advance&nbsp;&nbsp;&nbsp;:</b>{" "}
              {formatMoney(rentalOrder.advanceAmount)}
            </p>

            <p>
              <b>Balance&nbsp;&nbsp;&nbsp;:</b>{" "}
              {formatMoney(balanceAmount)}
            </p>
          </div>
        </div>

        <div className="rental-mini-line" />

        <div className="rental-total-row">
          <span>Total</span>
          <span>:</span>
          <span>
            {formatMoney(rentalOrder.rentalAmount)}
          </span>
        </div>

        <div className="rental-line payment-line" />

        <p className="rental-section-title">
          Payment Details
        </p>

        <div className="rental-payment">
          <p>
            <span>Advance Amount</span>
            <span>:</span>
            <span>
              {formatMoney(rentalOrder.advanceAmount)}
            </span>
          </p>

          <p>
            <span>Balance Amount</span>
            <span>:</span>
            <span>{formatMoney(balanceAmount)}</span>
          </p>

          <p>
            <span>Online Sale</span>
            <span>:</span>
            <span>
              {formatMoney(rentalOrder.advanceAmount)}
            </span>
          </p>
        </div>

        <div className="rental-line" />

        <div className="rental-terms">
          <p>
            RENTAL ITEMS MUST BE RETURNED ON RETURN DATE.
          </p>

          <p>
            DAMAGES OR MISSING ITEMS WILL BE CHARGED.
          </p>

          <p>
            ID PROOF IS REQUIRED FOR RENTAL CONFIRMATION.
          </p>

          <p>NO CASH REFUND WITHOUT BILL.</p>
        </div>

        <div className="rental-line" />

        <footer className="rental-receipt-footer">
          <p className="center bold">
            THANK YOU!!! VISIT AGAIN!!!
          </p>

          <p className="center bold">
            HAVE A NICE DAY!!!
          </p>
        </footer>
      </section>

      <style jsx global>{`
        @page {
          size: 70mm 130mm;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 70mm !important;
            height: 130mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
          }

          .rental-bill-page {
            width: 70mm !important;
            height: 130mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .rental-receipt {
            width: 68mm !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 auto !important;
            padding: 1.5mm 1mm 0.5mm !important;
            overflow: visible !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }

        .rental-receipt,
        .rental-receipt * {
          box-sizing: border-box;
        }

        .rental-receipt {
          width: 68mm;
          min-height: 0;
          margin: 0 auto;
          padding: 3mm 1.5mm 1mm;
          background: white;
          color: black;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8.5px;
          line-height: 1.15;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
        }

        .rental-receipt p {
          margin: 0;
          padding: 0;
        }

        .rental-receipt h1 {
          margin: 0;
          padding: 0;
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          line-height: 1;
        }

        .rental-receipt h2 {
          margin: 2px 0 0;
          padding: 0;
          text-align: center;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.1;
        }

        .rental-receipt-header {
          margin: 0;
          padding: 0;
        }

        .center {
          text-align: center;
        }

        .bold {
          font-weight: 700;
        }

        .rental-line {
          width: 100%;
          margin: 3px 0;
          border-top: 1px dashed black;
        }

        .rental-mini-line {
          width: 48%;
          margin: 2px 0 2px auto;
          border-top: 1px dashed black;
        }

        .rental-bill-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
        }

        .rental-bill-grid p {
          margin: 0.5px 0;
        }

        .rental-date-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 4px;
          row-gap: 1px;
        }

        .rental-date-details p:last-child {
          grid-column: 1 / -1;
        }

        .rental-receipt table {
          width: 100%;
          margin: 0;
          padding: 0;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .rental-receipt th {
          padding: 1.5px 0;
          font-size: 8px;
          font-weight: 700;
          text-align: right;
          white-space: nowrap;
          border-bottom: 1px dashed black;
        }

        .rental-receipt td {
          padding: 1.5px 0;
          font-size: 8px;
          text-align: right;
          vertical-align: top;
        }

        .rental-receipt .left {
          text-align: left;
        }

        .rental-items-table th:first-child,
        .rental-items-table td:first-child {
          width: 39%;
          padding-right: 2px;
          overflow-wrap: anywhere;
        }

        .rental-items-table th:nth-child(2),
        .rental-items-table td:nth-child(2) {
          width: 9%;
        }

        .rental-items-table th:nth-child(3),
        .rental-items-table td:nth-child(3) {
          width: 23%;
        }

        .rental-items-table th:nth-child(4),
        .rental-items-table td:nth-child(4) {
          width: 29%;
        }

        .rental-summary {
          display: grid;
          grid-template-columns: 0.9fr 1.35fr;
          gap: 3px;
        }

        .rental-summary p {
          margin: 1px 0;
        }

        .rental-total-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 5px;
          margin: 0;
          padding: 0;
          font-size: 15px;
          font-weight: 800;
          text-align: right;
          line-height: 1.05;
        }

        .payment-line {
          margin-top: 3px;
        }

        .rental-section-title {
          margin: 0 0 1px !important;
          font-weight: 700;
        }

        .rental-payment p {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 5px;
          margin: 1px 0;
        }

        .rental-payment span:last-child {
          text-align: right;
        }

        .rental-terms {
          margin: 0;
          padding: 0;
          font-size: 7.5px;
          font-weight: 700;
          line-height: 1.12;
        }

        .rental-terms p {
          margin: 1px 0;
        }

        .rental-receipt-footer {
          margin: 0;
          padding: 0;
          font-size: 8px;
          line-height: 1.1;
        }

        .rental-receipt-footer p {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </main>
  );
}
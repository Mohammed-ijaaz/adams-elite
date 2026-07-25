"use client";

import { Order } from "@/data/orders";

interface PrintableOrderBillProps {
  order: Order;
}

function getInclusiveGstAmount(amount: number, gstPercent: number) {
  return amount - amount / (1 + gstPercent / 100);
}

function formatMoney(amount: number) {
  return amount.toFixed(2);
}

export default function PrintableOrderBill({
  order,
}: PrintableOrderBillProps) {
  const billDate = new Date(order.createdAt);

  const totalQty = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalItems = order.items.length;

  const totalGst = order.items.reduce((total, item) => {
    const itemAmount = item.price * item.quantity;
    const gstPercent = item.gstPercent || 3;

    return total + getInclusiveGstAmount(itemAmount, gstPercent);
  }, 0);

  const taxRows = order.items.reduce<Record<string, number>>(
    (groups, item) => {
      const gstPercent = item.gstPercent || 3;
      const itemAmount = item.price * item.quantity;
      const gstAmount = getInclusiveGstAmount(itemAmount, gstPercent);

      groups[gstPercent] = (groups[gstPercent] || 0) + gstAmount;

      return groups;
    },
    {}
  );

  return (
    <main className="bill-page min-h-screen bg-stone-100 px-4 py-8">
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

      <section className="receipt">
        <header className="receipt-header">
          <h1>Adams Elite</h1>

          <p className="center bold">
            Old No. 144, New No.61, L.B ROAD, ADYAR
          </p>

          <p className="center">
            Chennai-600 020 &nbsp;&nbsp; Ph: 044-47905577
          </p>

          <p className="center">WhatsApp: 9840905577</p>

          <p className="center">
            Instagram: chennai_adams_collection
          </p>

          <p className="center bold">GSTN 33ALSPJ7520P1ZI</p>

          <h2>ONLINE_BILL</h2>
        </header>

        <div className="line" />

        <div className="bill-grid">
          <div>
            <p>
              <b>NAME :</b> {order.customerName}
            </p>

            <p>
              <b>PH&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</b>{" "}
              {order.customerPhone}
            </p>
          </div>

          <div>
            <p>
              <b>Bill No :</b> OL{String(order.id).padStart(4, "0")}
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

        <div className="line" />

        <table className="items-table">
          <thead>
            <tr>
              <th className="left">Particulars</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="left">{item.name}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.price)}</td>
                <td>{formatMoney(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="line" />

        <div className="summary">
          <div>
            <p>
              <b>Total Items:</b> {totalItems}
            </p>

            <p>
              <b>Total Qty:</b> {totalQty}
            </p>
          </div>

          <div>
            <p>
              <b>Gross Amt :</b> {formatMoney(order.total)}
            </p>

            <p>
              <b>Total GST :</b> {formatMoney(totalGst)}
            </p>

            <p>
              <b>Ret Amt :</b> 0.00
            </p>
          </div>
        </div>

        <div className="mini-line" />

        <div className="total-row">
          <span>Total</span>
          <span>:</span>
          <span>{formatMoney(order.total)}</span>
        </div>

        <p className="section-title">Tax Details</p>

        <table className="tax-table">
          <thead>
            <tr>
              <th>SGST%</th>
              <th>SGST</th>
              <th>CGST%</th>
              <th>CGST</th>
              <th>GST</th>
              <th>TOTAL</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(taxRows).map(
              ([gstPercent, gstAmount]) => (
                <tr key={gstPercent}>
                  <td>{formatMoney(Number(gstPercent) / 2)}</td>
                  <td>{formatMoney(gstAmount / 2)}</td>
                  <td>{formatMoney(Number(gstPercent) / 2)}</td>
                  <td>{formatMoney(gstAmount / 2)}</td>
                  <td>{formatMoney(Number(gstPercent))}</td>
                  <td>{formatMoney(gstAmount)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <div className="line payment-divider" />

        <p className="section-title payment-title">
          Payment Details
        </p>

        <div className="payment">
          <p>
            <span>Cash Tendered</span>
            <span>:</span>
            <span>0.00</span>
          </p>

          <p>
            <span>Balance Amount</span>
            <span>:</span>
            <span>0.00</span>
          </p>

          <p>
            <span>Card Sale</span>
            <span>:</span>
            <span>0.00</span>
          </p>

          <p>
            <span>Online Sale</span>
            <span>:</span>
            <span>{formatMoney(order.total)}</span>
          </p>
        </div>

        <div className="line" />

        <div className="terms">
          <p>EXCHANGE WITHIN TWO DAYS ONLY!</p>
          <p>NO EXCHANGE/GUARANTEE FOR TOYS, COSMETICS,</p>
          <p>THREAD AND GLASS BANGLES!! NO EXCHANGE</p>
          <p>WITHOUT PURCHASE BILL NO CASH REFUND</p>
        </div>

        <div className="line" />

        <footer className="receipt-footer">
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

          .bill-page {
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

          .receipt {
            width: 68mm !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 auto !important;
            padding: 2mm 1mm 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
          }

          .receipt-footer {
            margin: 0 !important;
            padding: 0 !important;
          }

          .receipt-footer p:last-child {
            margin-bottom: 0 !important;
          }
        }

        .receipt,
        .receipt * {
          box-sizing: border-box;
        }

        .receipt {
          width: 68mm;
          height: auto;
          min-height: 0;
          margin: 0 auto;
          padding: 4mm 2mm 2mm;
          background: white;
          color: black;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          line-height: 1.25;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
        }

        .receipt p {
          margin: 0;
          padding: 0;
        }

        .receipt h1 {
          margin: 0;
          padding: 0;
          text-align: center;
          font-size: 23px;
          font-weight: 800;
          line-height: 1.05;
        }

        .receipt h2 {
          margin: 4px 0 0;
          padding: 0;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.1;
        }

        .receipt-header {
          margin: 0;
          padding: 0;
        }

        .center {
          text-align: center;
        }

        .bold {
          font-weight: 700;
        }

        .line {
          width: 100%;
          margin: 5px 0;
          border-top: 1px dashed black;
        }

        .mini-line {
          width: 45%;
          margin: 3px 0 3px auto;
          border-top: 1px dashed black;
        }

        .bill-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .bill-grid p {
          margin: 1px 0;
        }

        .receipt table {
          width: 100%;
          margin: 0;
          padding: 0;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .receipt th {
          padding: 2px 0;
          font-size: 9px;
          font-weight: 700;
          text-align: right;
          white-space: nowrap;
          border-bottom: 1px dashed black;
        }

        .receipt td {
          padding: 2px 0;
          font-size: 9px;
          text-align: right;
          vertical-align: top;
        }

        .receipt .left {
          text-align: left;
        }

        .items-table th:first-child,
        .items-table td:first-child {
          width: 40%;
          padding-right: 2px;
          overflow-wrap: anywhere;
        }

        .items-table th:nth-child(2),
        .items-table td:nth-child(2) {
          width: 10%;
        }

        .items-table th:nth-child(3),
        .items-table td:nth-child(3) {
          width: 22%;
        }

        .items-table th:nth-child(4),
        .items-table td:nth-child(4) {
          width: 28%;
        }

        .summary {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 4px;
        }

        .summary p {
          margin: 1px 0;
        }

        .total-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 7px;
          margin: 0;
          padding: 0;
          font-size: 17px;
          font-weight: 800;
          text-align: right;
        }

        .section-title {
          margin: 6px 0 2px !important;
          font-weight: 700;
        }

        .tax-table th {
          padding: 2px 0;
          font-size: 8px;
          text-align: center;
        }

        .tax-table td {
          padding: 1px 0;
          font-size: 8px;
          text-align: center;
        }

        .payment-divider {
          margin-top: 6px;
        }

        .payment-title {
          margin-top: 0 !important;
        }

        .payment p {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 7px;
          margin: 1px 0;
        }

        .payment span:last-child {
          text-align: right;
        }

        .terms {
          margin: 0;
          padding: 0;
          font-size: 9px;
          font-weight: 700;
          line-height: 1.2;
        }

        .terms p {
          margin: 1px 0;
        }

        .receipt-footer {
          margin: 0;
          padding: 0;
          font-size: 9px;
          line-height: 1.2;
        }

        .receipt-footer p {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </main>
  );
}
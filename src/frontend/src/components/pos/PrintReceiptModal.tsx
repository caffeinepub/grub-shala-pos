import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bluetooth, Printer, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface ReceiptData {
  orderId?: string;
  outletName: string;
  customerName: string;
  customerMobile: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  taxEnabled: boolean;
  taxAmount: number;
  total: number;
  placedAt: Date;
}

interface PrintReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

function buildEscPosBytes(r: ReceiptData): Uint8Array {
  const enc = new TextEncoder();
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;

  const lines: number[] = [];

  const push = (bytes: number[]) => lines.push(...bytes);
  const text = (s: string) => push(Array.from(enc.encode(s)));
  const nl = () => push([LF]);

  // Initialize
  push([ESC, 0x40]);
  // Center align
  push([ESC, 0x61, 0x01]);
  // Bold on + outlet name
  push([ESC, 0x45, 0x01]);
  text(`${r.outletName}\n`);
  push([ESC, 0x45, 0x00]);
  text("RECEIPT\n");
  // Left align
  push([ESC, 0x61, 0x00]);

  const dateStr = r.placedAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = r.placedAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  text(`${dateStr} ${timeStr}\n`);

  const SEP = "--------------------------------\n";
  text(SEP);
  text(`Customer: ${r.customerName}\n`);
  text(`Mobile  : ${r.customerMobile}\n`);
  text(SEP);

  for (const item of r.items) {
    text(`${item.name} x${item.quantity}\n`);
    text(`  Rs.${(item.unitPrice * item.quantity).toFixed(2)}\n`);
  }

  text(SEP);
  text(`Subtotal : Rs.${r.subtotal.toFixed(2)}\n`);
  if (r.taxEnabled) {
    text(`GST (5%) : Rs.${r.taxAmount.toFixed(2)}\n`);
  }
  push([ESC, 0x45, 0x01]);
  text(`TOTAL    : Rs.${r.total.toFixed(2)}\n`);
  push([ESC, 0x45, 0x00]);
  text(SEP);

  // Center + thank you
  push([ESC, 0x61, 0x01]);
  text("Thank you!\n");
  nl();
  nl();

  // Partial cut
  push([GS, 0x56, 0x42, 0x00]);

  return new Uint8Array(lines);
}

// Web Bluetooth API types (not in standard TS lib)
type BtNav = typeof navigator & { bluetooth: any };

async function printViaBluetooth(r: ReceiptData) {
  const btNav = navigator as BtNav;
  if (!btNav.bluetooth) {
    toast.error(
      "Web Bluetooth not supported in this browser. Try Chrome on Android/Desktop.",
    );
    return;
  }

  let device: any;
  try {
    device = await btNav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
      ],
    });
  } catch {
    // User cancelled
    return;
  }

  try {
    const server = await device.gatt.connect();

    let characteristic: any = null;

    // Try primary service
    try {
      const svc = await server.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb",
      );
      characteristic = await svc.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb",
      );
    } catch {
      // fallback
    }

    if (!characteristic) {
      try {
        const svc = await server.getPrimaryService(
          "0000ffe0-0000-1000-8000-00805f9b34fb",
        );
        characteristic = await svc.getCharacteristic(
          "0000ffe1-0000-1000-8000-00805f9b34fb",
        );
      } catch {
        toast.error(
          "Could not find a writable characteristic on this printer.",
        );
        server.disconnect();
        return;
      }
    }

    const data = buildEscPosBytes(r);
    const CHUNK = 20;
    for (let i = 0; i < data.length; i += CHUNK) {
      await characteristic.writeValueWithoutResponse(data.slice(i, i + CHUNK));
    }

    server.disconnect();
    toast.success("Receipt sent to printer!");
  } catch (err) {
    toast.error(
      `Bluetooth print failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export default function PrintReceiptModal({
  open,
  onClose,
  receipt,
}: PrintReceiptModalProps) {
  const [btLoading, setBtLoading] = useState(false);

  if (!receipt) return null;

  function handleStandardPrint() {
    const styleId = "receipt-print-style";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #receipt-printable { display: block !important; }
        #receipt-printable * { display: revert !important; }
      }
    `;
    window.onafterprint = () => {
      const s = document.getElementById(styleId);
      if (s) s.remove();
      window.onafterprint = null;
    };
    window.print();
  }

  async function handleBluetoothPrint() {
    setBtLoading(true);
    await printViaBluetooth(receipt!);
    setBtLoading(false);
  }

  const dateStr = receipt.placedAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = receipt.placedAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm w-full p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold">
              Order Receipt
            </DialogTitle>
            <button
              type="button"
              data-ocid="receipt.close_button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] px-4 py-3">
          {/* Thermal receipt preview */}
          <div
            id="receipt-printable"
            data-ocid="receipt.panel"
            className="bg-white text-black font-mono text-[11px] leading-relaxed rounded-lg border border-gray-200 shadow-inner p-4 mx-auto"
            style={{ maxWidth: 280 }}
          >
            <div className="text-center mb-1">
              <p className="font-bold text-sm">{receipt.outletName}</p>
              <p className="font-semibold">RECEIPT</p>
            </div>
            <p className="text-center text-[10px] text-gray-500 mb-1">
              {dateStr} {timeStr}
            </p>
            <hr className="border-dashed border-gray-400 mb-1" />
            <p>Customer: {receipt.customerName}</p>
            <p>Mobile: {receipt.customerMobile}</p>
            <hr className="border-dashed border-gray-400 my-1" />
            {receipt.items.map((item, i) => (
              <div key={`${item.name}-${i}`} className="flex justify-between">
                <span className="flex-1 truncate pr-2">
                  {item.name} x{item.quantity}
                </span>
                <span className="whitespace-nowrap">
                  Rs.{(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <hr className="border-dashed border-gray-400 my-1" />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs.{receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.taxEnabled && (
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>Rs.{receipt.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm mt-1">
              <span>TOTAL</span>
              <span>Rs.{receipt.total.toFixed(2)}</span>
            </div>
            <hr className="border-dashed border-gray-400 mt-1 mb-2" />
            <p className="text-center text-[10px] text-gray-500">Thank you!</p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-border flex flex-col gap-2">
          <Button
            data-ocid="receipt.print.primary_button"
            onClick={handleStandardPrint}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print (Standard)
          </Button>
          <Button
            data-ocid="receipt.bluetooth.button"
            variant="outline"
            onClick={handleBluetoothPrint}
            disabled={btLoading}
            className="w-full font-semibold text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {btLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-emerald-400/40 border-t-emerald-600 rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              <>
                <Bluetooth className="w-4 h-4 mr-2" />
                Print via Bluetooth
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer, Order } from "../../backend";
import {
  useCustomers,
  useDeleteOrder,
  useOrders,
  useOutlets,
} from "../../hooks/useQueries";

const SKELETON_ROWS = [1, 2, 3, 4, 5];

function downloadCSV(
  orders: Order[],
  outlets: { id: string; name: string }[],
  customerMap: Record<string, Customer>,
) {
  const outletMap = Object.fromEntries(outlets.map((o) => [o.id, o.name]));
  const header = [
    "Order ID",
    "Outlet",
    "Customer Name",
    "Customer Mobile",
    "Items Count",
    "Subtotal",
    "Tax Applied",
    "Tax Amount",
    "Total",
    "Date",
  ];
  const rows = orders.map((o) => [
    o.id,
    outletMap[o.outletId] ?? o.outletId,
    customerMap[o.customerMobile]?.name ?? "",
    o.customerMobile,
    o.items.length.toString(),
    o.subtotal.toFixed(2),
    o.taxApplied ? "Yes" : "No",
    o.taxAmount.toFixed(2),
    o.total.toFixed(2),
    new Date(Number(o.createdAt)).toLocaleString("en-IN"),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grub-shala-orders-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterOutletId, setFilterOutletId] = useState<string | null>(null);

  const { data: outlets = [] } = useOutlets();
  const { data: customers = [] } = useCustomers();

  const customerMap: Record<string, Customer> = Object.fromEntries(
    customers.map((c) => [c.mobile, c]),
  );

  const startTime = startDate
    ? BigInt(new Date(startDate).setHours(0, 0, 0, 0))
    : null;
  const endTime = endDate
    ? BigInt(new Date(endDate).setHours(23, 59, 59, 999))
    : null;

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useOrders(startTime, endTime, filterOutletId);
  const deleteOrder = useDeleteOrder();

  async function handleDelete(id: string) {
    try {
      await deleteOrder.mutateAsync(id);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    }
  }

  const outletMap = Object.fromEntries(outlets.map((o) => [o.id, o.name]));

  return (
    <div data-ocid="orders.section" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Orders</h2>
        <div className="flex gap-2">
          <Button
            data-ocid="orders.refresh.button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            data-ocid="orders.download.button"
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(orders, outlets, customerMap)}
            disabled={orders.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Download CSV
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-xs">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            From Date
          </Label>
          <Input
            data-ocid="orders.start_date.input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            To Date
          </Label>
          <Input
            data-ocid="orders.end_date.input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Outlet
          </Label>
          <Select
            value={filterOutletId ?? "all"}
            onValueChange={(v) => setFilterOutletId(v === "all" ? null : v)}
          >
            <SelectTrigger data-ocid="orders.outlet.select" className="w-48">
              <SelectValue placeholder="All Outlets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setFilterOutletId(null);
          }}
        >
          Clear Filters
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div data-ocid="orders.loading_state" className="p-6 space-y-3">
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-10 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div
            data-ocid="orders.empty_state"
            className="p-12 text-center text-muted-foreground"
          >
            <p className="text-sm">No orders found for the selected filters.</p>
          </div>
        ) : (
          <Table data-ocid="orders.table">
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Order ID
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Outlet
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Customer Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Mobile
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Items
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Subtotal
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Tax
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Total
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Date
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, idx) => (
                <TableRow
                  key={order.id}
                  data-ocid={`orders.item.${idx + 1}`}
                  className="hover:bg-secondary/30"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-sm">
                    {outletMap[order.outletId] ?? order.outletId}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {customerMap[order.customerMobile]?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.customerMobile}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {order.items.length} items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    ₹{order.subtotal.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.taxApplied ? (
                      <span className="text-amber-700">
                        ₹{order.taxAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-amber-700">
                    ₹{order.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(Number(order.createdAt)).toLocaleDateString(
                      "en-IN",
                    )}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          data-ocid={`orders.delete.button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-ocid="orders.delete.dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The order will be
                            permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="orders.delete.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="orders.delete.confirm_button"
                            onClick={() => handleDelete(order.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteOrder.isPending}
                          >
                            {deleteOrder.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

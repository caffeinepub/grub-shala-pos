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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Customer } from "../../backend";
import { useCustomers, useDeleteCustomer } from "../../hooks/useQueries";

const SKELETON_ROWS = [1, 2, 3, 4, 5];

function downloadCSV(customers: Customer[]) {
  const header = ["Mobile Number", "Name"];
  const rows = customers.map((c) => [c.mobile, c.name]);
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grub-shala-customers-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersTab() {
  const { data: customers = [], isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  async function handleDelete(mobile: string) {
    try {
      await deleteCustomer.mutateAsync(mobile);
      toast.success("Customer deleted");
    } catch {
      toast.error("Failed to delete customer");
    }
  }

  return (
    <div data-ocid="customers.section" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Customers</h2>
        <Button
          data-ocid="customers.download.button"
          variant="outline"
          size="sm"
          onClick={() => downloadCSV(customers)}
          disabled={customers.length === 0}
        >
          <Download className="w-4 h-4 mr-1" />
          Download CSV
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div data-ocid="customers.loading_state" className="p-6 space-y-3">
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-10 w-full" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div
            data-ocid="customers.empty_state"
            className="p-12 text-center text-muted-foreground"
          >
            <p className="text-sm">No customers found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="customers.table">
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Mobile Number
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, idx) => (
                  <TableRow
                    key={customer.mobile}
                    data-ocid={`customers.item.${idx + 1}`}
                    className="hover:bg-secondary/30"
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-sm whitespace-nowrap">
                      {customer.mobile}
                    </TableCell>
                    <TableCell className="text-sm">
                      {customer.name || (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            data-ocid={`customers.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={deleteCustomer.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="customers.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete {customer.name || customer.mobile}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The customer and all
                              associated data will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="customers.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              data-ocid="customers.confirm_button"
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(customer.mobile)}
                              disabled={deleteCustomer.isPending}
                            >
                              {deleteCustomer.isPending ? (
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
          </div>
        )}
      </div>
    </div>
  );
}

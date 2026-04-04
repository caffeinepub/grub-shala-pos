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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateOutlet,
  useDeleteOutlet,
  useOutlets,
  useUpdateOutlet,
} from "../../hooks/useQueries";

const SKELETON_ROWS = [1, 2, 3];

export default function OutletsTab() {
  const [newName, setNewName] = useState("");

  const { data: outlets = [], isLoading } = useOutlets();
  const createOutlet = useCreateOutlet();
  const deleteOutlet = useDeleteOutlet();
  const updateOutlet = useUpdateOutlet();

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Please enter an outlet name");
      return;
    }
    try {
      await createOutlet.mutateAsync({
        name: newName.trim(),
        active: true,
      });
      setNewName("");
      toast.success("Outlet created");
    } catch {
      toast.error("Failed to create outlet");
    }
  }

  async function handleToggleActive(id: string, name: string, active: boolean) {
    try {
      await updateOutlet.mutateAsync({ id, name, active: !active });
    } catch {
      toast.error("Failed to update outlet");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteOutlet.mutateAsync(id);
      toast.success("Outlet deleted");
    } catch {
      toast.error("Failed to delete outlet");
    }
  }

  return (
    <div data-ocid="outlets.section" className="space-y-4">
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-emerald-600" />
        <h2 className="text-lg font-bold">Outlets</h2>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <p className="text-sm font-semibold mb-3">Add New Outlet</p>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="w-full sm:flex-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Outlet Name <span className="text-red-500">*</span>
            </Label>
            <Input
              data-ocid="outlets.name.input"
              placeholder="e.g. Grub Shala - Sector 10"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button
            data-ocid="outlets.add.primary_button"
            onClick={handleCreate}
            disabled={createOutlet.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
          >
            {createOutlet.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            Add Outlet
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div data-ocid="outlets.loading_state" className="p-6 space-y-3">
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-12 w-full" />
            ))}
          </div>
        ) : outlets.length === 0 ? (
          <div
            data-ocid="outlets.empty_state"
            className="p-12 text-center text-muted-foreground"
          >
            <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No outlets found. Add one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="outlets.table">
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Active
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {outlets.map((outlet, idx) => (
                  <TableRow
                    key={outlet.id}
                    data-ocid={`outlets.item.${idx + 1}`}
                    className="hover:bg-secondary/30"
                  >
                    <TableCell className="text-sm font-semibold whitespace-nowrap">
                      {outlet.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          outlet.active
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"
                            : "bg-secondary text-muted-foreground text-xs"
                        }
                      >
                        {outlet.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        data-ocid={`outlets.active.switch.${idx + 1}`}
                        checked={outlet.active}
                        onCheckedChange={() =>
                          handleToggleActive(
                            outlet.id,
                            outlet.name,
                            outlet.active,
                          )
                        }
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            data-ocid={`outlets.delete.button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="outlets.delete.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Outlet?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{outlet.name}" will be permanently deleted. This
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="outlets.delete.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              data-ocid="outlets.delete.confirm_button"
                              onClick={() => handleDelete(outlet.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deleteOutlet.isPending}
                            >
                              {deleteOutlet.isPending ? (
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

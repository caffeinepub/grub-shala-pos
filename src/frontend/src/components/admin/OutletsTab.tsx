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
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
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
  const [newActive, setNewActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  const { data: outlets = [], isLoading } = useOutlets();
  const createOutlet = useCreateOutlet();
  const updateOutlet = useUpdateOutlet();
  const deleteOutlet = useDeleteOutlet();

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Enter outlet name");
      return;
    }
    try {
      await createOutlet.mutateAsync({
        name: newName.trim(),
        active: newActive,
      });
      setNewName("");
      setNewActive(true);
      toast.success("Outlet created");
    } catch {
      toast.error("Failed to create outlet");
    }
  }

  function startEdit(id: string, name: string, active: boolean) {
    setEditingId(id);
    setEditName(name);
    setEditActive(active);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      await updateOutlet.mutateAsync({
        id,
        name: editName.trim(),
        active: editActive,
      });
      setEditingId(null);
      toast.success("Outlet updated");
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
      <h2 className="text-lg font-bold">Outlets</h2>

      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <p className="text-sm font-semibold mb-3">Add New Outlet</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Outlet Name
            </Label>
            <Input
              data-ocid="outlets.name.input"
              placeholder="e.g. Grub Shala - Sector 73"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Switch
              data-ocid="outlets.active.switch"
              checked={newActive}
              onCheckedChange={setNewActive}
              className="data-[state=checked]:bg-amber-600"
            />
            <Label className="text-sm">Active</Label>
          </div>
          <Button
            data-ocid="outlets.add.primary_button"
            onClick={handleCreate}
            disabled={createOutlet.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
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
              <Skeleton key={n} className="h-10 w-full" />
            ))}
          </div>
        ) : outlets.length === 0 ? (
          <div
            data-ocid="outlets.empty_state"
            className="p-12 text-center text-muted-foreground"
          >
            <p className="text-sm">No outlets found. Add one above.</p>
          </div>
        ) : (
          <Table data-ocid="outlets.table">
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Status
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
                  <TableCell>
                    {editingId === outlet.id ? (
                      <Input
                        data-ocid="outlets.edit.input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm w-64"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium">{outlet.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === outlet.id ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          data-ocid="outlets.edit.active.switch"
                          checked={editActive}
                          onCheckedChange={setEditActive}
                          className="data-[state=checked]:bg-amber-600"
                        />
                        <span className="text-xs">
                          {editActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ) : (
                      <Badge
                        className={
                          outlet.active
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-secondary text-muted-foreground"
                        }
                      >
                        {outlet.active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      {editingId === outlet.id ? (
                        <>
                          <Button
                            data-ocid={`outlets.save.button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:bg-green-50"
                            onClick={() => saveEdit(outlet.id)}
                            disabled={updateOutlet.isPending}
                          >
                            {updateOutlet.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            data-ocid={`outlets.cancel.button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          data-ocid={`outlets.edit.button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            startEdit(outlet.id, outlet.name, outlet.active)
                          }
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
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
                              Deleting "{outlet.name}" cannot be undone.
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
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

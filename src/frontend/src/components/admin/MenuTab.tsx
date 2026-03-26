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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateMenuItem,
  useDeleteMenuItem,
  useMenuItems,
  useOutlets,
  useUpdateMenuItem,
} from "../../hooks/useQueries";

const SKELETON_ROWS = [1, 2, 3, 4, 5];

export default function MenuTab() {
  const [newOutletId, setNewOutletId] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newAvailable, setNewAvailable] = useState(true);
  const [filterOutletId, setFilterOutletId] = useState<string | null>(null);

  const { data: outlets = [] } = useOutlets();
  const { data: menuItems = [], isLoading } = useMenuItems(filterOutletId);
  const createMenuItem = useCreateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const updateMenuItem = useUpdateMenuItem();

  const outletMap = Object.fromEntries(outlets.map((o) => [o.id, o.name]));

  async function handleCreate() {
    if (!newOutletId) {
      toast.error("Select an outlet");
      return;
    }
    if (!newName.trim()) {
      toast.error("Enter item name");
      return;
    }
    if (!newCategory.trim()) {
      toast.error("Enter category");
      return;
    }
    const price = Number.parseFloat(newPrice);
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Enter valid price");
      return;
    }
    try {
      await createMenuItem.mutateAsync({
        outletId: newOutletId,
        name: newName.trim(),
        category: newCategory.trim(),
        price,
        available: newAvailable,
      });
      setNewName("");
      setNewCategory("");
      setNewPrice("");
      setNewAvailable(true);
      toast.success("Menu item added");
    } catch {
      toast.error("Failed to add menu item");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMenuItem.mutateAsync(id);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  }

  async function handleToggleAvailable(
    id: string,
    outletId: string,
    name: string,
    category: string,
    price: number,
    available: boolean,
  ) {
    try {
      await updateMenuItem.mutateAsync({
        id,
        outletId,
        name,
        category,
        price,
        available: !available,
      });
    } catch {
      toast.error("Failed to update item");
    }
  }

  return (
    <div data-ocid="menu.section" className="space-y-4">
      <h2 className="text-lg font-bold">Menu Items</h2>

      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <p className="text-sm font-semibold mb-3">Add New Menu Item</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Outlet
            </Label>
            <Select value={newOutletId} onValueChange={setNewOutletId}>
              <SelectTrigger data-ocid="menu.outlet.select">
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Item Name
            </Label>
            <Input
              data-ocid="menu.name.input"
              placeholder="e.g. Chicken Burger"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Category
            </Label>
            <Input
              data-ocid="menu.category.input"
              placeholder="e.g. Burgers"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Price (₹)
            </Label>
            <Input
              data-ocid="menu.price.input"
              type="number"
              placeholder="0.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch
              data-ocid="menu.available.switch"
              checked={newAvailable}
              onCheckedChange={setNewAvailable}
              className="data-[state=checked]:bg-amber-600"
            />
            <Label className="text-sm">Available</Label>
          </div>
          <div className="flex items-end">
            <Button
              data-ocid="menu.add.primary_button"
              onClick={handleCreate}
              disabled={createMenuItem.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full"
            >
              {createMenuItem.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Add Item
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 items-end">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Filter by Outlet
          </Label>
          <Select
            value={filterOutletId ?? "all"}
            onValueChange={(v) => setFilterOutletId(v === "all" ? null : v)}
          >
            <SelectTrigger data-ocid="menu.filter.select" className="w-48">
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
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div data-ocid="menu.loading_state" className="p-6 space-y-3">
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-10 w-full" />
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <div
            data-ocid="menu.empty_state"
            className="p-12 text-center text-muted-foreground"
          >
            <p className="text-sm">No menu items found. Add one above.</p>
          </div>
        ) : (
          <Table data-ocid="menu.table">
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Outlet
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Category
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Price
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">
                  Available
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item, idx) => (
                <TableRow
                  key={item.id}
                  data-ocid={`menu.item.${idx + 1}`}
                  className="hover:bg-secondary/30"
                >
                  <TableCell className="text-sm font-medium">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {outletMap[item.outletId] ?? item.outletId}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-amber-700">
                    ₹{item.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      data-ocid={`menu.available.switch.${idx + 1}`}
                      checked={item.available}
                      onCheckedChange={() =>
                        handleToggleAvailable(
                          item.id,
                          item.outletId,
                          item.name,
                          item.category,
                          item.price,
                          item.available,
                        )
                      }
                      className="data-[state=checked]:bg-amber-600"
                    />
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          data-ocid={`menu.delete.button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-ocid="menu.delete.dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{item.name}" will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="menu.delete.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="menu.delete.confirm_button"
                            onClick={() => handleDelete(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMenuItem.isPending}
                          >
                            Delete
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

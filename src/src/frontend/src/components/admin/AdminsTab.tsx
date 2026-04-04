import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Copy,
  Loader2,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useAddAdmin, useAdmins, useRemoveAdmin } from "../../hooks/useQueries";

export default function AdminsTab() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const { data: admins = [], isLoading } = useAdmins();
  const addAdmin = useAddAdmin();
  const removeAdmin = useRemoveAdmin();

  const [newPrincipalInput, setNewPrincipalInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  function handleCopyOwn() {
    if (!currentPrincipal) return;
    navigator.clipboard.writeText(currentPrincipal).then(() => {
      setCopied(true);
      toast.success("Principal ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyAdmin(principal: string) {
    navigator.clipboard.writeText(principal).then(() => {
      toast.success("Principal ID copied");
    });
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newPrincipalInput.trim();
    if (!trimmed) {
      toast.error("Please enter a Principal ID");
      return;
    }
    if (trimmed.length < 20) {
      toast.error("That doesn't look like a valid Principal ID");
      return;
    }
    try {
      await addAdmin.mutateAsync(trimmed);
      setNewPrincipalInput("");
      toast.success("Admin added successfully");
    } catch (err: any) {
      const msg = err?.message ?? "Failed to add admin";
      if (msg.includes("Invalid") || msg.includes("principal")) {
        toast.error("Invalid Principal ID — check the value and try again");
      } else {
        toast.error(msg);
      }
    }
  }

  async function handleConfirmRemove() {
    if (!confirmRemove) return;
    try {
      await removeAdmin.mutateAsync(confirmRemove);
      toast.success("Admin removed");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to remove admin");
    } finally {
      setConfirmRemove(null);
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Admin Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Control who has access to this admin panel. Use Principal IDs — the
            unique identity on ICP.
          </p>
        </div>

        {/* Your Principal ID card */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">
              Your Principal ID
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this with someone you want to grant admin access. They must
            open the Admin Panel and log in first to see their own Principal ID.
          </p>
          <div className="flex items-center gap-2">
            <code
              data-ocid="admins.principal_id.input"
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground break-all select-all"
            >
              {currentPrincipal || "—"}
            </code>
            <Button
              type="button"
              data-ocid="admins.copy_principal.button"
              size="sm"
              variant="outline"
              onClick={handleCopyOwn}
              className="shrink-0 border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/30"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 italic">
            Note: ICP uses Principal IDs for identity — not Google email
            addresses. Each person's Principal ID is tied to their Internet
            Identity account.
          </p>
        </div>

        {/* Add new admin form */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Add New Admin
          </h3>
          <form onSubmit={handleAddAdmin} className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-admin-principal"
                className="text-xs text-muted-foreground"
              >
                New Admin Principal ID
              </Label>
              <Input
                id="new-admin-principal"
                data-ocid="admins.new_admin.input"
                placeholder="e.g. 6kfru-4aaaa-aaaab-..."
                value={newPrincipalInput}
                onChange={(e) => setNewPrincipalInput(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Ask the person to open the app, go to Admin Panel, log in, and
                copy their Principal ID from the top of this tab.
              </p>
            </div>
            <Button
              type="submit"
              data-ocid="admins.add_admin.primary_button"
              disabled={addAdmin.isPending || !newPrincipalInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {addAdmin.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Current admins list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Current Admins
            </h3>
            {!isLoading && (
              <span className="text-xs text-muted-foreground">
                {admins.length} {admins.length === 1 ? "admin" : "admins"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div data-ocid="admins.loading_state" className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : admins.length === 0 ? (
            <div
              data-ocid="admins.empty_state"
              className="p-6 text-center text-sm text-muted-foreground"
            >
              No admins found.
            </div>
          ) : (
            <ul data-ocid="admins.list" className="divide-y divide-border">
              {admins.map(([principal, role], index) => {
                const principalStr = principal.toString();
                const isCurrentUser = principalStr === currentPrincipal;
                return (
                  <li
                    key={principalStr}
                    data-ocid={`admins.item.${index + 1}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <code className="text-xs font-mono text-foreground truncate block max-w-xs cursor-default">
                              {principalStr.slice(0, 25)}...
                            </code>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="font-mono text-xs max-w-sm break-all"
                          >
                            {principalStr}
                          </TooltipContent>
                        </Tooltip>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-emerald-600/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            You
                          </span>
                        )}
                        <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full font-medium shrink-0 capitalize">
                          {role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            data-ocid={`admins.copy.button.${index + 1}`}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyAdmin(principalStr)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Principal ID</TooltipContent>
                      </Tooltip>

                      {!isCurrentUser && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              data-ocid={`admins.delete_button.${index + 1}`}
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                              onClick={() => setConfirmRemove(principalStr)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove admin</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Confirm remove dialog */}
      <Dialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <DialogContent data-ocid="admins.remove.dialog">
          <DialogHeader>
            <DialogTitle>Remove Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this admin? They will lose access
              to the admin panel immediately.
            </DialogDescription>
          </DialogHeader>
          {confirmRemove && (
            <div className="bg-secondary rounded-lg px-3 py-2">
              <code className="text-xs font-mono text-foreground break-all">
                {confirmRemove}
              </code>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="admins.remove.cancel_button"
              variant="outline"
              onClick={() => setConfirmRemove(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admins.remove.confirm_button"
              variant="destructive"
              disabled={removeAdmin.isPending}
              onClick={handleConfirmRemove}
            >
              {removeAdmin.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Admin"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

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
  CheckCircle2,
  ChefHat,
  LayoutDashboard,
  Menu,
  Minus,
  Plus,
  Settings,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MenuItem } from "../../backend";
import { useIsMobile } from "../../hooks/use-mobile";
import {
  useMenuItems,
  useOutlets,
  usePlaceOrder,
} from "../../hooks/useQueries";
import PrintReceiptModal from "./PrintReceiptModal";
import type { ReceiptData } from "./PrintReceiptModal";

const SKELETON_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8];

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface Props {
  onGoAdmin: () => void;
}

export default function POSScreen({ onGoAdmin }: Props) {
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<ReceiptData | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: outlets = [], isLoading: outletLoading } = useOutlets();
  const { data: menuItems = [], isLoading: menuLoading } =
    useMenuItems(selectedOutletId);
  const placeOrder = usePlaceOrder();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      setSelectedOutletId(outlets[0].id);
    }
  }, [outlets, selectedOutletId]);

  // Close overlays when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
      setCartOpen(false);
    }
  }, [isMobile]);

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId);
  const availableItems = menuItems.filter((m) => m.available);
  const categories = [
    "All",
    ...Array.from(new Set(availableItems.map((m) => m.category))),
  ];
  const filteredItems =
    selectedCategory === "All"
      ? availableItems
      : availableItems.filter((m) => m.category === selectedCategory);

  const subtotal = cart.reduce(
    (sum, ci) => sum + ci.menuItem.price * ci.quantity,
    0,
  );
  const TAX_RATE = 0.05;
  const taxAmount = taxEnabled ? subtotal * TAX_RATE : 0;
  const grandTotal = subtotal + taxAmount;
  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci,
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function updateQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((ci) =>
          ci.menuItem.id === itemId
            ? { ...ci, quantity: ci.quantity + delta }
            : ci,
        )
        .filter((ci) => ci.quantity > 0),
    );
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  }

  async function handlePlaceOrder() {
    if (!selectedOutletId) {
      toast.error("Please select an outlet");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Please enter the customer name");
      return;
    }
    if (!customerMobile || customerMobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      await placeOrder.mutateAsync({
        outletId: selectedOutletId,
        customerMobile,
        customerName: customerName.trim(),
        items: cart.map((ci) => ({
          menuItemId: ci.menuItem.id,
          name: ci.menuItem.name,
          quantity: BigInt(ci.quantity),
          unitPrice: ci.menuItem.price,
        })),
        subtotal,
        taxApplied: taxEnabled,
        taxAmount,
        total: grandTotal,
      });

      // Capture receipt data before clearing cart
      setPrintReceipt({
        outletName: activeOutlet?.name ?? "",
        customerName: customerName.trim(),
        customerMobile,
        items: cart.map((ci) => ({
          name: ci.menuItem.name,
          quantity: ci.quantity,
          unitPrice: ci.menuItem.price,
        })),
        subtotal,
        taxEnabled,
        taxAmount,
        total: grandTotal,
        placedAt: new Date(),
      });
      setPrintModalOpen(true);

      setOrderSuccess(true);
      setCart([]);
      setCustomerName("");
      setCustomerMobile("");
      setTaxEnabled(false);
      setCartOpen(false);
      setTimeout(() => setOrderSuccess(false), 3000);
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const CartContents = () => (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <AnimatePresence>
          {cart.length === 0 ? (
            <div
              data-ocid="cart.empty_state"
              className="flex flex-col items-center justify-center h-32 text-muted-foreground"
            >
              <ShoppingBag className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No items in cart</p>
            </div>
          ) : (
            cart.map((ci, idx) => (
              <motion.div
                key={ci.menuItem.id}
                data-ocid={`cart.item.${idx + 1}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 bg-background rounded-lg p-2 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {ci.menuItem.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    ₹{ci.menuItem.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-ocid={`cart.qty.minus.${idx + 1}`}
                    onClick={() => updateQty(ci.menuItem.id, -1)}
                    className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center">
                    {ci.quantity}
                  </span>
                  <button
                    type="button"
                    data-ocid={`cart.qty.plus.${idx + 1}`}
                    onClick={() => updateQty(ci.menuItem.id, 1)}
                    className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    data-ocid={`cart.delete.button.${idx + 1}`}
                    onClick={() => removeFromCart(ci.menuItem.id)}
                    className="w-6 h-6 rounded-md text-destructive flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              data-ocid="cart.tax.switch"
              checked={taxEnabled}
              onCheckedChange={setTaxEnabled}
              className="data-[state=checked]:bg-emerald-600"
            />
            <Label className="text-sm text-muted-foreground cursor-pointer">
              GST (5%)
            </Label>
          </div>
          {taxEnabled && (
            <span className="text-sm font-medium">₹{taxAmount.toFixed(2)}</span>
          )}
        </div>

        <div className="flex justify-between text-base font-bold border-t border-border pt-2">
          <span>Grand Total</span>
          <span className="text-emerald-700">₹{grandTotal.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <Button
            data-ocid="cart.clear.button"
            variant="outline"
            size="sm"
            onClick={() => setCart([])}
            className="flex-1 text-xs"
            disabled={cart.length === 0}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        <AnimatePresence>
          {orderSuccess && (
            <motion.div
              data-ocid="cart.success_state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2 text-green-700 text-xs font-medium"
            >
              <CheckCircle2 className="w-4 h-4" />
              Order placed successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          data-ocid="cart.place_order.primary_button"
          onClick={handlePlaceOrder}
          disabled={placeOrder.isPending || cart.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm"
        >
          {placeOrder.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Placing...
            </span>
          ) : (
            "PLACE ORDER & PAY"
          )}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-charcoal flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-charcoal-light">
          <img
            src="/assets/uploads/grub_logo_white.jpg-019d2879-724e-76fe-b488-5ce5d0569f40-1.jpeg"
            alt="Grub Shala"
            className="w-36 h-12 object-contain"
          />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-3">
            Navigation
          </p>
          <button
            type="button"
            data-ocid="nav.pos.link"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-600/20 text-emerald-300 text-sm font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            POS Terminal
          </button>
          <button
            type="button"
            data-ocid="nav.admin.link"
            onClick={onGoAdmin}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-charcoal-light text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Admin Panel
          </button>
        </nav>
        <div className="p-3 border-t border-charcoal-light">
          <p className="text-white/40 text-[10px] text-center">
            © {new Date().getFullYear()} Grub Shala
          </p>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed left-0 top-0 bottom-0 w-56 bg-charcoal flex flex-col z-50 md:hidden"
            >
              <div className="px-5 py-4 border-b border-charcoal-light flex items-center justify-between">
                <img
                  src="/assets/uploads/grub_logo_white.jpg-019d2879-724e-76fe-b488-5ce5d0569f40-1.jpeg"
                  alt="Grub Shala"
                  className="w-28 h-10 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-3">
                  Navigation
                </p>
                <button
                  type="button"
                  data-ocid="nav.pos.link"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-600/20 text-emerald-300 text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  POS Terminal
                </button>
                <button
                  type="button"
                  data-ocid="nav.admin.link"
                  onClick={() => {
                    setSidebarOpen(false);
                    onGoAdmin();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-charcoal-light text-sm font-medium transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Admin Panel
                </button>
              </nav>
              <div className="p-3 border-t border-charcoal-light">
                <p className="text-white/40 text-[10px] text-center">
                  © {new Date().getFullYear()} Grub Shala
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-1 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-[18px] md:text-[22px] font-bold text-foreground">
            POS Dashboard
          </h1>

          <div className="hidden md:block text-center">
            <p className="text-sm font-semibold text-foreground">
              {formatTime(currentTime)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDate(currentTime)}
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {activeOutlet && (
              <Badge className="hidden md:flex bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
                {activeOutlet.name}
              </Badge>
            )}
            {/* Mobile cart button */}
            <button
              type="button"
              data-ocid="cart.open_modal_button"
              className="md:hidden relative p-1.5 rounded-md hover:bg-secondary transition-colors"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden p-3 md:p-4 gap-3 md:gap-4">
            <div className="bg-card rounded-xl border border-border shadow-card p-3 md:p-4">
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Outlet
                  </Label>
                  {outletLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={selectedOutletId ?? ""}
                      onValueChange={setSelectedOutletId}
                    >
                      <SelectTrigger
                        data-ocid="pos.outlet.select"
                        className="bg-background"
                      >
                        <SelectValue placeholder="Select outlet" />
                      </SelectTrigger>
                      <SelectContent>
                        {outlets
                          .filter((o) => o.active)
                          .map((outlet) => (
                            <SelectItem key={outlet.id} value={outlet.id}>
                              {outlet.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    data-ocid="pos.name.input"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    data-ocid="pos.mobile.input"
                    placeholder="Enter 10-digit number"
                    value={customerMobile}
                    onChange={(e) =>
                      setCustomerMobile(
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-card rounded-xl border border-border shadow-card">
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      data-ocid="pos.category.tab"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-emerald-600 text-white"
                          : "bg-background border border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 md:p-4">
                {menuLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {SKELETON_ITEMS.map((n) => (
                      <Skeleton key={n} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div
                    data-ocid="menu.empty_state"
                    className="flex flex-col items-center justify-center h-40 text-muted-foreground"
                  >
                    <ChefHat className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No items in this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        data-ocid={`menu.item.${idx + 1}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-cream-light rounded-xl border border-border p-3 flex flex-col gap-2 hover:border-emerald-400 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-semibold text-sm text-foreground leading-tight flex-1">
                            {item.name}
                          </p>
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-emerald-200 shrink-0">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-emerald-700 font-bold text-base">
                            ₹{item.price.toFixed(2)}
                          </span>
                          <Button
                            data-ocid={`menu.add.button.${idx + 1}`}
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3 text-xs font-semibold"
                          >
                            Add
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Desktop cart panel */}
          <aside className="hidden md:flex w-80 flex-shrink-0 border-l border-border bg-card flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm">Current Order</h2>
              </div>
              <Badge className="bg-accent text-accent-foreground border-emerald-200 text-[11px]">
                {cart.length === 0 ? "Empty" : "Pending"}
              </Badge>
            </div>
            <CartContents />
          </aside>
        </div>
      </div>

      {/* Mobile cart bottom sheet */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              data-ocid="cart.modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-2xl shadow-2xl flex flex-col md:hidden"
              style={{ maxHeight: "80vh" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-bold text-sm">Current Order</h2>
                  {cartCount > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px]">
                      {cartCount} items
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid="cart.close_button"
                  onClick={() => setCartOpen(false)}
                  className="p-1 rounded-md hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <CartContents />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Print Receipt Modal */}
      <PrintReceiptModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        receipt={printReceipt}
      />
    </div>
  );
}

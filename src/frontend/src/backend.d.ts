import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Outlet {
    id: string;
    active: boolean;
    name: string;
}
export interface MenuCategory {
    id: string;
    outletId: string;
    name: string;
}
export interface MenuItem {
    id: string;
    name: string;
    available: boolean;
    outletId: string;
    category: string;
    price: number;
}
export interface OrderItem {
    name: string;
    quantity: bigint;
    unitPrice: number;
    menuItemId: string;
}
export interface Customer {
    name: string;
    mobile: string;
}
export interface Order {
    id: string;
    status: string;
    total: number;
    createdAt: bigint;
    customerMobile: string;
    outletId: string;
    items: Array<OrderItem>;
    taxAmount: number;
    subtotal: number;
    taxApplied: boolean;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMenuCategory(outletId: string, name: string): Promise<MenuCategory>;
    createMenuItem(outletId: string, name: string, category: string, price: number, available: boolean): Promise<MenuItem>;
    createOutlet(name: string, active: boolean): Promise<Outlet>;
    deleteMenuCategory(id: string): Promise<boolean>;
    deleteMenuItem(id: string): Promise<boolean>;
    deleteOrder(id: string): Promise<boolean>;
    deleteOutlet(id: string): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(mobile: string): Promise<Customer | null>;
    getCustomers(): Promise<Array<Customer>>;
    getMenuCategories(outletId: string | null): Promise<Array<MenuCategory>>;
    getMenuItem(id: string): Promise<MenuItem | null>;
    getMenuItems(outletId: string | null): Promise<Array<MenuItem>>;
    getOrder(id: string): Promise<Order | null>;
    getOrders(startTime: bigint | null, endTime: bigint | null, outletId: string | null): Promise<Array<Order>>;
    getOutlet(id: string): Promise<Outlet | null>;
    getOutlets(): Promise<Array<Outlet>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(outletId: string, customerMobile: string, customerName: string, items: Array<OrderItem>, subtotal: number, taxApplied: boolean, taxAmount: number, total: number, status: string, createdAt: bigint): Promise<Order>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMenuCategory(id: string, outletId: string, name: string): Promise<MenuCategory | null>;
    updateMenuItem(id: string, outletId: string, name: string, category: string, price: number, available: boolean): Promise<MenuItem | null>;
    updateOutlet(id: string, name: string, active: boolean): Promise<Outlet | null>;
}

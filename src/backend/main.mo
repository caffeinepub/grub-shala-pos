import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization module handles ONLY core authentication logic with role-based access control
  // and serves as a dependency for user management mixin
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    role : Text; // "admin", "staff", etc.
  };

  // Entity Types
  public type Outlet = {
    id : Text;
    name : Text;
    active : Bool;
  };

  public type MenuItem = {
    id : Text;
    outletId : Text;
    name : Text;
    category : Text;
    price : Float;
    available : Bool;
  };

  public type OrderItem = {
    menuItemId : Text;
    name : Text;
    quantity : Nat;
    unitPrice : Float;
  };

  public type Order = {
    id : Text;
    outletId : Text;
    customerMobile : Text;
    items : [OrderItem];
    subtotal : Float;
    taxApplied : Bool;
    taxAmount : Float;
    total : Float;
    status : Text;
    createdAt : Int;
  };

  public type Customer = {
    mobile : Text;
    name : Text;
  };

  // Persistent state
  var outletEntries : [(Text, Outlet)] = [];
  var menuItemEntries : [(Text, MenuItem)] = [];
  var orderEntries : [(Text, Order)] = [];
  var customerEntries : [(Text, Customer)] = [];
  var userProfileEntries : [(Principal, UserProfile)] = [];
  var nextOutletId : Nat = 1;
  var nextMenuItemId : Nat = 1;
  var nextOrderId : Nat = 1;

  // Init persistent collections
  let outlets = Map.fromIter<Text, Outlet>(outletEntries.values());
  let menuItems = Map.fromIter<Text, MenuItem>(menuItemEntries.values());
  let orders = Map.fromIter<Text, Order>(orderEntries.values());
  let customers = Map.fromIter<Text, Customer>(customerEntries.values());
  let userProfiles = Map.fromIter<Principal, UserProfile>(userProfileEntries.values());

  // System upgrade hooks
  system func preupgrade() {
    outletEntries := outlets.entries().toArray();
    menuItemEntries := menuItems.entries().toArray();
    orderEntries := orders.entries().toArray();
    customerEntries := customers.entries().toArray();
    userProfileEntries := userProfiles.entries().toArray();
  };

  system func postupgrade() {
    outletEntries := [];
    menuItemEntries := [];
    orderEntries := [];
    customerEntries := [];
    userProfileEntries := [];
  };

  // Initialize with default outlets
  private func seedDefaultOutlets() {
    if (outlets.size() == 0) {
      let outlet1 : Outlet = {
        id = "outlet_1";
        name = "Grub Shala - Energizer";
        active = true;
      };
      let outlet2 : Outlet = {
        id = "outlet_2";
        name = "Grub Shala - Sector 73";
        active = true;
      };
      outlets.add(outlet1.id, outlet1);
      outlets.add(outlet2.id, outlet2);
      nextOutletId := 3;
    };
  };

  seedDefaultOutlets();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user: Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Outlet Management (Admin Only)
  public query ({ caller }) func getOutlets() : async [Outlet] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view outlets");
    };
    outlets.values().toArray();
  };

  public query ({ caller }) func getOutlet(id : Text) : async ?Outlet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view outlets");
    };
    outlets.get(id);
  };

  public shared ({ caller }) func createOutlet(name : Text, active : Bool) : async Outlet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create outlets");
    };
    let id = "outlet_" # nextOutletId.toText();
    nextOutletId += 1;
    let outlet : Outlet = {
      id = id;
      name = name;
      active = active;
    };
    outlets.add(id, outlet);
    outlet;
  };

  public shared ({ caller }) func updateOutlet(id : Text, name : Text, active : Bool) : async ?Outlet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update outlets");
    };
    switch (outlets.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : Outlet = {
          id = id;
          name = name;
          active = active;
        };
        outlets.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteOutlet(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete outlets");
    };
    let oldSize = outlets.size();
    outlets.remove(id);
    let newSize = outlets.size();
    newSize < oldSize;
  };

  // Menu Item Management (Admin Only)
  public query ({ caller }) func getMenuItems(outletId : ?Text) : async [MenuItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view menu items");
    };
    let allItems = menuItems.values().toArray();
    switch (outletId) {
      case (null) { allItems };
      case (?oid) {
        allItems.filter(func(item) { item.outletId == oid });
      };
    };
  };

  public query ({ caller }) func getMenuItem(id : Text) : async ?MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view menu items");
    };
    menuItems.get(id);
  };

  public shared ({ caller }) func createMenuItem(
    outletId : Text,
    name : Text,
    category : Text,
    price : Float,
    available : Bool
  ) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create menu items");
    };
    let id = "menu_" # nextMenuItemId.toText();
    nextMenuItemId += 1;
    let item : MenuItem = {
      id = id;
      outletId = outletId;
      name = name;
      category = category;
      price = price;
      available = available;
    };
    menuItems.add(id, item);
    item;
  };

  public shared ({ caller }) func updateMenuItem(
    id : Text,
    outletId : Text,
    name : Text,
    category : Text,
    price : Float,
    available : Bool
  ) : async ?MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update menu items");
    };
    switch (menuItems.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : MenuItem = {
          id = id;
          outletId = outletId;
          name = name;
          category = category;
          price = price;
          available = available;
        };
        menuItems.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete menu items");
    };
    let oldSize = menuItems.size();
    menuItems.remove(id);
    let newSize = menuItems.size();
    newSize < oldSize;
  };

  // Order Management
  public shared ({ caller }) func placeOrder(
    outletId : Text,
    customerMobile : Text,
    customerName : Text,
    items : [OrderItem],
    subtotal : Float,
    taxApplied : Bool,
    taxAmount : Float,
    total : Float,
    status : Text,
    createdAt : Int
  ) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    // Upsert customer
    let customer : Customer = {
      mobile = customerMobile;
      name = customerName;
    };
    customers.add(customerMobile, customer);

    // Create order
    let id = "order_" # nextOrderId.toText();
    nextOrderId += 1;
    let order : Order = {
      id = id;
      outletId = outletId;
      customerMobile = customerMobile;
      items = items;
      subtotal = subtotal;
      taxApplied = taxApplied;
      taxAmount = taxAmount;
      total = total;
      status = status;
      createdAt = createdAt;
    };
    orders.add(id, order);
    order;
  };

  public query ({ caller }) func getOrders(
    startTime : ?Int,
    endTime : ?Int,
    outletId : ?Text
  ) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    let allOrders = orders.values().toArray();
    allOrders.filter(func(order) {
      let timeMatch = switch (startTime, endTime) {
        case (?start, ?end) { order.createdAt >= start and order.createdAt <= end };
        case (?start, null) { order.createdAt >= start };
        case (null, ?end) { order.createdAt <= end };
        case (null, null) { true };
      };
      let outletMatch = switch (outletId) {
        case (null) { true };
        case (?oid) { order.outletId == oid };
      };
      timeMatch and outletMatch;
    });
  };

  public query ({ caller }) func getOrder(id : Text) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.get(id);
  };

  public shared ({ caller }) func deleteOrder(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete orders");
    };
    let oldSize = orders.size();
    orders.remove(id);
    let newSize = orders.size();
    newSize < oldSize;
  };

  // Customer Management
  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.values().toArray();
  };

  public query ({ caller }) func getCustomer(mobile : Text) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.get(mobile);
  };
};

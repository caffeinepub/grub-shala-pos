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
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  public type Outlet = {
    id : Text;
    name : Text;
    active : Bool;
  };

  public type MenuCategory = {
    id : Text;
    outletId : Text;
    name : Text;
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
  var menuCategoryEntries : [(Text, MenuCategory)] = [];
  var menuItemEntries : [(Text, MenuItem)] = [];
  var orderEntries : [(Text, Order)] = [];
  var customerEntries : [(Text, Customer)] = [];
  var userProfileEntries : [(Principal, UserProfile)] = [];
  var nextOutletId : Nat = 1;
  var nextMenuCategoryId : Nat = 1;
  var nextMenuItemId : Nat = 1;
  var nextOrderId : Nat = 1;

  let outlets = Map.fromIter<Text, Outlet>(outletEntries.values());
  let menuCategories = Map.fromIter<Text, MenuCategory>(menuCategoryEntries.values());
  let menuItems = Map.fromIter<Text, MenuItem>(menuItemEntries.values());
  let orders = Map.fromIter<Text, Order>(orderEntries.values());
  let customers = Map.fromIter<Text, Customer>(customerEntries.values());
  let userProfiles = Map.fromIter<Principal, UserProfile>(userProfileEntries.values());

  system func preupgrade() {
    outletEntries := outlets.entries().toArray();
    menuCategoryEntries := menuCategories.entries().toArray();
    menuItemEntries := menuItems.entries().toArray();
    orderEntries := orders.entries().toArray();
    customerEntries := customers.entries().toArray();
    userProfileEntries := userProfiles.entries().toArray();
  };

  system func postupgrade() {
    outletEntries := [];
    menuCategoryEntries := [];
    menuItemEntries := [];
    orderEntries := [];
    customerEntries := [];
    userProfileEntries := [];
  };

  private func seedDefaultOutlets() {
    if (outlets.size() == 0) {
      let outlet1 : Outlet = { id = "outlet_1"; name = "Grub Shala - Energizer"; active = true };
      let outlet2 : Outlet = { id = "outlet_2"; name = "Grub Shala - Sector 73"; active = true };
      outlets.add(outlet1.id, outlet1);
      outlets.add(outlet2.id, outlet2);
      nextOutletId := 3;
    };
  };

  seedDefaultOutlets();

  // First-run admin claim: allows first logged-in user to become admin when no admin exists yet
  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be logged in to claim admin");
    };
    if (accessControlState.adminAssigned) {
      return false; // Admin already exists
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    true;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user: Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  // Outlet Management
  public query func getOutlets() : async [Outlet] {
    outlets.values().toArray();
  };

  public query ({ caller }) func getOutlet(id : Text) : async ?Outlet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    outlets.get(id);
  };

  public shared ({ caller }) func createOutlet(name : Text, active : Bool) : async Outlet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let id = "outlet_" # nextOutletId.toText();
    nextOutletId += 1;
    let outlet : Outlet = { id; name; active };
    outlets.add(id, outlet);
    outlet;
  };

  public shared ({ caller }) func updateOutlet(id : Text, name : Text, active : Bool) : async ?Outlet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    switch (outlets.get(id)) {
      case (null) { null };
      case (?_) {
        let updated : Outlet = { id; name; active };
        outlets.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteOutlet(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let oldSize = outlets.size();
    outlets.remove(id);
    outlets.size() < oldSize;
  };

  // Menu Category Management
  public query func getMenuCategories(outletId : ?Text) : async [MenuCategory] {
    let all = menuCategories.values().toArray();
    switch (outletId) {
      case (null) { all };
      case (?oid) { all.filter(func(c) { c.outletId == oid }) };
    };
  };

  public shared ({ caller }) func createMenuCategory(outletId : Text, name : Text) : async MenuCategory {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let id = "cat_" # nextMenuCategoryId.toText();
    nextMenuCategoryId += 1;
    let cat : MenuCategory = { id; outletId; name };
    menuCategories.add(id, cat);
    cat;
  };

  public shared ({ caller }) func updateMenuCategory(id : Text, outletId : Text, name : Text) : async ?MenuCategory {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    switch (menuCategories.get(id)) {
      case (null) { null };
      case (?_) {
        let updated : MenuCategory = { id; outletId; name };
        menuCategories.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteMenuCategory(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let oldSize = menuCategories.size();
    menuCategories.remove(id);
    menuCategories.size() < oldSize;
  };

  // Menu Item Management
  public query func getMenuItems(outletId : ?Text) : async [MenuItem] {
    let allItems = menuItems.values().toArray();
    switch (outletId) {
      case (null) { allItems };
      case (?oid) { allItems.filter(func(item) { item.outletId == oid }) };
    };
  };

  public query ({ caller }) func getMenuItem(id : Text) : async ?MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
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
      Runtime.trap("Unauthorized");
    };
    let id = "menu_" # nextMenuItemId.toText();
    nextMenuItemId += 1;
    let item : MenuItem = { id; outletId; name; category; price; available };
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
      Runtime.trap("Unauthorized");
    };
    switch (menuItems.get(id)) {
      case (null) { null };
      case (?_) {
        let updated : MenuItem = { id; outletId; name; category; price; available };
        menuItems.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let oldSize = menuItems.size();
    menuItems.remove(id);
    menuItems.size() < oldSize;
  };

  // Order Management
  public shared func placeOrder(
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
    customers.add(customerMobile, { mobile = customerMobile; name = customerName });
    let id = "order_" # nextOrderId.toText();
    nextOrderId += 1;
    let order : Order = { id; outletId; customerMobile; items; subtotal; taxApplied; taxAmount; total; status; createdAt };
    orders.add(id, order);
    order;
  };

  public query ({ caller }) func getOrders(
    startTime : ?Int,
    endTime : ?Int,
    outletId : ?Text
  ) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    orders.values().toArray().filter(func(order) {
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
      Runtime.trap("Unauthorized");
    };
    orders.get(id);
  };

  public shared ({ caller }) func deleteOrder(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let oldSize = orders.size();
    orders.remove(id);
    orders.size() < oldSize;
  };

  // Customer Management
  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    customers.values().toArray();
  };

  public query ({ caller }) func getCustomer(mobile : Text) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    customers.get(mobile);
  };

  public shared ({ caller }) func deleteCustomer(mobile : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let oldSize = customers.size();
    customers.remove(mobile);
    customers.size() < oldSize;
  };
};

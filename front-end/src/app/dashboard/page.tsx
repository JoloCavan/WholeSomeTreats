"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export interface Product {
  id: number;
  name: string;
  base_price: number;
  unit_type: string;
  image_url?: string | null;
  is_available: boolean;
}

export interface ProductVariation {
  id: number;
  product_id: number;
  flavor_name: string;
  price: number;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name?: string;
  variation_id?: number | null;
  flavor_name?: string;
  unit_type?: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: number;
  user_id: number;
  customer_name?: string;
  customer_address?: string;
  delivery_date?: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id?: number;
  product_id: number;
  variation_id?: number | null;
  quantity: number;
  product_name: string;
  flavor_name?: string;
  unit_type?: string;
  image_url?: string;
  price: number;
}

const loadStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("wt_cart");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Load cart error:", e);
  }
  return [];
};

const saveStoredCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("wt_cart", JSON.stringify(items));
  } catch (e) {
    console.error("Save cart error:", e);
  }
};

export interface UserItem {
  id: number;
  username: string;
  full_name: string;
  phone_number: string;
  address: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name: string;
  content: string;
  image_url?: string;
  created_at: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender_id: 1,
    sender_name: "WholeSome",
    receiver_id: 4,
    receiver_name: "Jeicho",
    content: "Hi Jeicho! Thank you for ordering from WholesomeTreats. Your order is being prepared fresh!",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    sender_id: 4,
    sender_name: "Jeicho",
    receiver_id: 1,
    receiver_name: "WholeSome",
    content: "Thank you so much! Can't wait to try the Cheesecake!",
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

const loadStoredMessages = (): ChatMessage[] => {
  if (typeof window === "undefined") return initialMessages;
  try {
    const stored = localStorage.getItem("wt_messages");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Load messages error:", e);
  }
  return initialMessages;
};

const saveStoredMessages = (items: ChatMessage[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("wt_messages", JSON.stringify(items));
  } catch (e) {
    console.error("Save messages error:", e);
  }
};

const initialDashboardProducts: Product[] = [
  {
    id: 1,
    name: "Chocolate Chip Cookies",
    base_price: 45.0,
    unit_type: "pc",
    image_url: "/images/chocolate_chip_cookie.jpg",
    is_available: true,
  },
  {
    id: 2,
    name: "Chewy Cringles",
    base_price: 100.0,
    unit_type: "dozen",
    image_url: "/images/chewy_cringles.jpg",
    is_available: true,
  },
  {
    id: 3,
    name: "Chocolate Chip Nutty Banana Bread",
    base_price: 150.0,
    unit_type: "loaf",
    image_url: "/images/banana_bread.jpg",
    is_available: true,
  },
  {
    id: 4,
    name: "Burnt Basque Cheesecake",
    base_price: 180.0,
    unit_type: "piece",
    image_url: "/images/burnt_basque_cheesecake.jpg",
    is_available: true,
  },
  {
    id: 5,
    name: "NewYork Cheesecake",
    base_price: 220.0,
    unit_type: "piece",
    image_url: "/images/newyork_cheesecake.jpg",
    is_available: true,
  },
];

export const getCategoryImageUrl = (p: { id?: number; name: string; image_url?: string | null }): string => {
  if (p.image_url && p.image_url.trim() !== "" && !p.image_url.includes("unsplash.com")) {
    return p.image_url;
  }
  const nameLower = (p.name || "").toLowerCase();
  if (nameLower.includes("cookie")) return "/images/chocolate_chip_cookie.jpg";
  if (nameLower.includes("cringle")) return "/images/chewy_cringles.jpg";
  if (nameLower.includes("banana")) return "/images/banana_bread.jpg";
  if (nameLower.includes("burnt")) return "/images/burnt_basque_cheesecake.jpg";
  if (nameLower.includes("newyork") || nameLower.includes("new york") || nameLower.includes("cheesecake")) return "/images/newyork_cheesecake.jpg";
  
  if (p.id === 1) return "/images/chocolate_chip_cookie.jpg";
  if (p.id === 2) return "/images/chewy_cringles.jpg";
  if (p.id === 3) return "/images/banana_bread.jpg";
  if (p.id === 4) return "/images/burnt_basque_cheesecake.jpg";
  if (p.id === 5) return "/images/newyork_cheesecake.jpg";

  return "/images/chocolate_chip_cookie.jpg";
};

const loadStoredProducts = (): Product[] => {
  if (typeof window === "undefined") return initialDashboardProducts;
  try {
    const stored = localStorage.getItem("wt_products");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: Product) => ({
          ...p,
          image_url: getCategoryImageUrl(p)
        }));
      }
    }
  } catch (e) {
    console.error("Load stored products error:", e);
  }
  return initialDashboardProducts;
};

const saveStoredProducts = (items: Product[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("wt_products", JSON.stringify(items));
  } catch (e) {
    console.error("Save stored products error:", e);
  }
};

export const defaultCheesecakeVariations: Record<number, ProductVariation[]> = {
  4: [
    { id: 1, product_id: 4, flavor_name: "Original", price: 180.0 },
    { id: 2, product_id: 4, flavor_name: "Strawberry", price: 200.0 },
    { id: 3, product_id: 4, flavor_name: "Blueberry", price: 200.0 },
    { id: 4, product_id: 4, flavor_name: "Mango", price: 200.0 },
  ],
  5: [
    { id: 5, product_id: 5, flavor_name: "Original", price: 220.0 },
    { id: 6, product_id: 5, flavor_name: "Strawberry", price: 240.0 },
    { id: 7, product_id: 5, flavor_name: "Blueberry", price: 240.0 },
    { id: 8, product_id: 5, flavor_name: "Mango", price: 240.0 },
  ],
};

const getStoredVariations = (productId: number): ProductVariation[] => {
  if (typeof window === "undefined") return defaultCheesecakeVariations[productId] || [];
  try {
    const raw = localStorage.getItem(`wt_variations_${productId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Get variations error:", e);
  }
  return defaultCheesecakeVariations[productId] || [];
};

const saveStoredVariations = (productId: number, vars: ProductVariation[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`wt_variations_${productId}`, JSON.stringify(vars));
  } catch (e) {
    console.error("Save variations error:", e);
  }
};

const initialOrders: Order[] = [];

const loadStoredOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("wt_orders");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((o: Order) => !(o.id <= 3 && (o.customer_name === "Jasmin T. Cavan" || !o.customer_name)));
      }
    }
  } catch (e) {
    console.error("Load stored orders error:", e);
  }
  return [];
};

const saveStoredOrders = (items: Order[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("wt_orders", JSON.stringify(items));
  } catch (e) {
    console.error("Save stored orders error:", e);
  }
};

const initialAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "🎉 Grand Weekend Promo!",
    content: "Enjoy 10% off on all Burnt Basque Cheesecakes this weekend only! Use promo code WHOLESOME10 at checkout.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    title: "📢 Fresh Batch Every Morning",
    content: "We bake our Artisan Chocolate Chip Cookies fresh every 7:00 AM! Order early to get hot out-of-the-oven treats.",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  }
];

const loadStoredAnnouncements = (): Announcement[] => {
  if (typeof window === "undefined") return initialAnnouncements;
  try {
    const stored = localStorage.getItem("wt_announcements");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Load announcements error:", e);
  }
  return initialAnnouncements;
};

const saveStoredAnnouncements = (items: Announcement[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("wt_announcements", JSON.stringify(items));
  } catch (e) {
    console.error("Save announcements error:", e);
  }
};

export const formatDeliveryDate = (dateStr?: string | null, createdAtStr?: string): string => {
  if (!dateStr || dateStr.trim() === "") {
    if (!createdAtStr) return "";
    const createdDate = new Date(createdAtStr);
    createdDate.setDate(createdDate.getDate() + 1);
    return `${createdDate.getMonth() + 1}/${createdDate.getDate()}/${createdDate.getFullYear()}`;
  }

  const str = dateStr.trim();
  if (str.includes("-")) {
    const cleanStr = str.split("T")[0];
    const parts = cleanStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && year.length === 4) {
        return `${month}/${day}/${year}`;
      }
    }
  }

  if (str.includes("/")) {
    return str;
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    }
  } catch (e) {}

  return str;
};

export const getTomorrowLocalDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [user, setUser] = useState<{ id?: number; username?: string; full_name?: string; role?: string } | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");

  // Variations Modal State
  const [selectedProductForVariations, setSelectedProductForVariations] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);

  // Add / Edit Product Modal
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: "",
    base_price: "",
    unit_type: "Piece",
    image_url: "",
    is_available: true,
  });

  const productFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectProductImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductFormData((prev) => ({
          ...prev,
          image_url: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic Variations in Modal
  const [hasProductVariations, setHasProductVariations] = useState(false);
  const [productFormVariations, setProductFormVariations] = useState<{ flavor_name: string; price: string }[]>([]);

  // Delete Product Modal (DELETE /api/products/admin/delete/{id})
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchOrder, setSearchOrder] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("All");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutProductId, setCheckoutProductId] = useState<number>(1);
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1);

  // Quick Order Modal State
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderVariationId, setOrderVariationId] = useState<number | null>(null);
  const [orderAddress, setOrderAddress] = useState<string>("Olongapo City");
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<string>("COD");
  const [orderDeliveryDate, setOrderDeliveryDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDeliveryAddress, setCartDeliveryAddress] = useState<string>("Olongapo City");
  const [cartDeliveryDate, setCartDeliveryDate] = useState<string>(getTomorrowLocalDateString());
  const [isCheckingOutCart, setIsCheckingOutCart] = useState<boolean>(false);

  const fetchCart = async () => {
    let localCart = loadStoredCart();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let currentUserId = 2;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.id) currentUserId = u.id;
      } catch (e) {}
    }

    try {
      const headers: Record<string, string> = {};
      if (token && token.length > 20) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let res = await fetch(`/api/cart?userId=${currentUserId}`, { headers });
      
      // If 401 Unauthorized (e.g. invalid or expired token), fallback to anonymous fetch
      if (res.status === 401 && headers["Authorization"]) {
        res = await fetch(`/api/cart?userId=${currentUserId}`);
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formattedCart: CartItem[] = data.map((item: any) => ({
            id: item.id || item.Id || Date.now(),
            user_id: item.user_id || item.userId || currentUserId,
            product_id: item.product_id || item.productId,
            variation_id: item.variation_id || item.variationId || null,
            quantity: item.quantity || item.Quantity || 1,
            product_name: item.product_name || item.productName || "Product",
            price: Number(item.price || item.Price || 0),
          }));
          setCart(formattedCart);
          saveStoredCart(formattedCart);
          return;
        }
      }
    } catch (err) {
      console.log("GET /api/cart notice:", err);
    }
    setCart(localCart);
  };

  const handleCartQuantityChange = (cartItemId: number, delta: number) => {
    const updated = cart.map((c) => {
      if (c.id === cartItemId) {
        const newQty = Math.max(1, c.quantity + delta);
        return { ...c, quantity: newQty };
      }
      return c;
    });
    setCart(updated);
    saveStoredCart(updated);
  };

  const handleRemoveFromCart = async (cartItemId: number) => {
    const updated = cart.filter((c) => c.id !== cartItemId);
    setCart(updated);
    saveStoredCart(updated);

    const token = localStorage.getItem("token");
    try {
      await fetch(`/api/cart/remove/${cartItemId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
    } catch (err) {
      console.log("DELETE /api/cart/remove notice:", err);
    }
    showToast("success", "Item removed from cart.");
  };

  const handleClearCart = async () => {
    setCart([]);
    saveStoredCart([]);

    const token = localStorage.getItem("token");
    try {
      await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
    } catch (err) {
      console.log("DELETE /api/cart/clear notice:", err);
    }
  };

  const handleCheckoutCart = async () => {
    if (cart.length === 0) return;
    setIsCheckingOutCart(true);

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let currentUserId = 2;
    let currentCustomerName = "Customer";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        currentCustomerName = u.full_name || u.username || "Customer";
        if (u.id) currentUserId = u.id;
      } catch (e) {}
    }

    const itemsSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalOrderAmount = itemsSubtotal + 50;

    const payload = {
      userId: currentUserId,
      customerName: currentCustomerName,
      customerAddress: cartDeliveryAddress || "Olongapo City",
      deliveryDate: cartDeliveryDate,
      items: cart.map((item) => ({
        productId: item.product_id,
        variationId: item.variation_id || null,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    let newOrderId = Date.now() + Math.floor(Math.random() * 1000);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.orderId) newOrderId = data.orderId;
      }
    } catch (err) {
      console.log("Checkout POST /api/orders/checkout notice:", err);
    }

    // Add single consolidated order to local orders
    const newOrder: Order = {
      id: newOrderId,
      user_id: currentUserId,
      customer_name: currentCustomerName,
      customer_address: cartDeliveryAddress || "Olongapo City",
      delivery_date: cartDeliveryDate,
      total_amount: totalOrderAmount,
      payment_method: "COD",
      status: "Processing",
      created_at: new Date().toISOString(),
      items: cart.map((item, idx) => ({
        id: Date.now() + idx,
        order_id: newOrderId,
        product_id: item.product_id,
        product_name: item.product_name,
        flavor_name: item.flavor_name,
        variation_id: item.variation_id || null,
        unit_type: item.unit_type || "pc",
        quantity: item.quantity,
        price_at_purchase: item.price,
      })),
    };

    let existingOrders = loadStoredOrders();
    saveStoredOrders([newOrder, ...existingOrders]);

    await handleClearCart();
    setIsCheckingOutCart(false);
    await fetchOrders();
    showToast("success", "🎉 Order placed successfully! Check your dashboard My Orders.");
    setActiveTab("orders");
  };

  // Users State
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // 1. GET /api/orders/admin/all & GET /api/orders/my-orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    let localOrders = loadStoredOrders();

    try {
      const res = await fetch("/api/orders/admin/all");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((o: any, idx: number) => ({
            id: o.id || o.Id || 1001 + idx,
            user_id: o.user_id || o.userId || 1,
            customer_name: o.customer_name || o.customerName || `Customer #${o.user_id || o.userId || 1}`,
            customer_address: o.customer_address || o.customerAddress || "Olongapo City",
            delivery_date: o.delivery_date || o.deliveryDate || "",
            total_amount: Number(o.total_amount || o.totalAmount || 0),
            payment_method: o.payment_method || o.paymentMethod || "COD",
            status: o.status || o.Status || "Processing",
            created_at: o.created_at || o.createdAt || new Date().toISOString(),
            items: o.items || []
          }));

          const map = new Map<number, Order>();
          formatted.forEach((o: Order) => map.set(o.id, o));
          localOrders.forEach((lo: Order) => {
            if (map.has(lo.id)) {
              const existing = map.get(lo.id)!;
              if (lo.customer_name && lo.customer_name !== "Jasmin T. Cavan") {
                existing.customer_name = lo.customer_name;
              }
              if (lo.delivery_date) {
                existing.delivery_date = lo.delivery_date;
              }
              if (lo.customer_address) {
                existing.customer_address = lo.customer_address;
              }
              if ((!existing.items || existing.items.length === 0) && lo.items && lo.items.length > 0) {
                existing.items = lo.items;
              }
            } else {
              map.set(lo.id, lo);
            }
          });
          const merged = Array.from(map.values())
            .filter((o) => !(o.id <= 3 && (o.customer_name === "Jasmin T. Cavan" || !o.customer_name)))
            .sort((a, b) => b.id - a.id);

          setOrders(merged);
          saveStoredOrders(merged);
          setLoadingOrders(false);
          return;
        }
      }
    } catch (err) {
      console.log("GET /api/orders/admin/all network notice:", err);
    }

    setOrders(localOrders);
    setLoadingOrders(false);
  };

  // 2. PUT /api/orders/admin/status/{orderId}
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch(`/api/orders/admin/status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.log("PUT /api/orders/admin/status notice:", err);
    }

    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updated);
    saveStoredOrders(updated);
    showToast("success", `Order #${orderId} status updated to ${newStatus}.`);
  };

  // 3. PUT /api/orders/cancel/{orderId}
  const handleCancelOrder = async (orderId: number) => {
    try {
      await fetch(`/api/orders/cancel/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.log("PUT /api/orders/cancel notice:", err);
    }

    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: "Cancelled" } : o
    );
    setOrders(updated);
    saveStoredOrders(updated);
    showToast("success", `Order #${orderId} cancelled.`);
  };

  // 5. DELETE /api/orders/admin/delete/{orderId}
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    const targetId = orderToDelete.id;

    // Remove from UI state and localStorage immediately
    const updated = orders.filter((o) => o.id !== targetId);
    setOrders(updated);
    saveStoredOrders(updated);
    setOrderToDelete(null);

    try {
      await fetch(`/api/orders/admin/delete/${targetId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.log("DELETE /api/orders/admin/delete notice:", err);
    }

    showToast("success", `Order #${targetId} deleted permanently.`);
  };

  // 4. POST /api/orders/checkout
  const handleCreateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === Number(checkoutProductId)) || products[0];
    let newOrderId = Date.now() % 10000;

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selProd.id,
          quantity: checkoutQuantity,
          price: selProd.base_price
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orderId) newOrderId = data.orderId;
      }
    } catch (err) {
      console.log("POST /api/orders/checkout notice:", err);
    }

    const newOrder: Order = {
      id: newOrderId,
      user_id: 1,
      customer_name: "Walk-in Customer",
      total_amount: selProd.base_price * checkoutQuantity,
      payment_method: "COD",
      status: "Pending",
      created_at: new Date().toISOString(),
      items: [
        {
          product_id: selProd.id,
          product_name: selProd.name,
          quantity: checkoutQuantity,
          price_at_purchase: selProd.base_price,
        }
      ]
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveStoredOrders(updated);
    setIsCheckoutModalOpen(false);
    showToast("success", `Order #${newOrderId} placed via Checkout!`);
  };

  const handleOpenOrderModal = (product: Product) => {
    setSelectedProductForOrder(product);
    setOrderQuantity(1);
    setOrderAddress(localStorage.getItem("wt_user_address") || "Olongapo City");
    setOrderPaymentMethod("COD");
    setOrderDeliveryDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);

    const storedVars = getStoredVariations(product.id);
    if (storedVars.length > 0) {
      setOrderVariationId(storedVars[0].id);
    } else {
      setOrderVariationId(null);
    }
  };

  const handleConfirmPlaceOrder = async () => {
    if (!selectedProductForOrder) return;
    setIsSubmittingOrder(true);

    const token = localStorage.getItem("token");
    let currentPrice = selectedProductForOrder.base_price;
    let selectedFlavorName: string | undefined = undefined;
    const storedVars = getStoredVariations(selectedProductForOrder.id);
    if (orderVariationId !== null && storedVars.length > 0) {
      const foundVar = storedVars.find((v) => v.id === orderVariationId);
      if (foundVar) {
        currentPrice = foundVar.price;
        selectedFlavorName = foundVar.flavor_name;
      }
    }

    const loggedUser = user || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {});
    let currentUserId = loggedUser?.id;
    if (!currentUserId) {
      if (loggedUser?.username?.toLowerCase() === "wholesome") currentUserId = 1;
      else if (loggedUser?.username?.toLowerCase() === "jeicho") currentUserId = 2;
      else currentUserId = 3;
    }

    const payload = {
      productId: selectedProductForOrder.id,
      variationId: orderVariationId,
      quantity: orderQuantity,
      userId: currentUserId,
    };

    try {
      await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.log("POST /api/cart/add notice:", err);
    }

    // Save to local cart
    const newCartItem: CartItem = {
      id: Date.now(),
      user_id: currentUserId,
      product_id: selectedProductForOrder.id,
      variation_id: orderVariationId,
      quantity: orderQuantity,
      product_name: selectedProductForOrder.name,
      flavor_name: selectedFlavorName,
      unit_type: selectedProductForOrder.unit_type,
      image_url: selectedProductForOrder.image_url || undefined,
      price: currentPrice,
    };

    const currentCart = loadStoredCart();
    const existingIdx = currentCart.findIndex(
      (c) => c.product_id === newCartItem.product_id && c.variation_id === newCartItem.variation_id
    );

    let updatedCart: CartItem[];
    if (existingIdx >= 0) {
      updatedCart = currentCart.map((item, idx) =>
        idx === existingIdx ? { ...item, quantity: item.quantity + orderQuantity } : item
      );
    } else {
      updatedCart = [newCartItem, ...currentCart];
    }

    setCart(updatedCart);
    saveStoredCart(updatedCart);

    setIsSubmittingOrder(false);
    setSelectedProductForOrder(null);
    showToast("success", `🛒 "${selectedProductForOrder.name}" added to cart!`);
    setActiveTab("cart");
  };

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [searchAnnouncement, setSearchAnnouncement] = useState("");
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({ title: "", content: "" });
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // 1. GET /api/announcements
  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAnnouncements(data);
          saveStoredAnnouncements(data);
          setLoadingAnnouncements(false);
          return;
        }
      }
    } catch (err) {
      console.log("GET /api/announcements network notice:", err);
    }

    const stored = loadStoredAnnouncements();
    setAnnouncements(stored);
    setLoadingAnnouncements(false);
  };

  useEffect(() => {
    setIsMounted(true);
    setCart(loadStoredCart());
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "announcements") {
      fetchAnnouncements();
    } else if (activeTab === "users" || activeTab === "messages") {
      fetchUsers();
    }
  }, [activeTab]);

  // Auto-refresh users list every 4 seconds to sync new database registrations automatically
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "users" || activeTab === "messages") {
        fetchUsers();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // 2. POST /api/announcements/admin/add
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementFormData.title.trim() || !announcementFormData.content.trim()) {
      showToast("error", "Please fill in title and content.");
      return;
    }

    let newId = Date.now();
    try {
      const res = await fetch("/api/announcements/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementFormData.title,
          content: announcementFormData.content,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) newId = data.id;
        await fetchAnnouncements();
        setIsAddAnnouncementOpen(false);
        setAnnouncementFormData({ title: "", content: "" });
        showToast("success", "Announcement posted successfully!");
        return;
      }
    } catch (err) {
      console.log("POST /api/announcements/admin/add notice:", err);
    }

    const newAnn: Announcement = {
      id: newId,
      title: announcementFormData.title,
      content: announcementFormData.content,
      created_at: new Date().toISOString(),
    };

    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    saveStoredAnnouncements(updated);
    setIsAddAnnouncementOpen(false);
    setAnnouncementFormData({ title: "", content: "" });
    showToast("success", "Announcement posted successfully!");
  };

  // 3. DELETE /api/announcements/admin/delete/{id}
  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    try {
      const res = await fetch(`/api/announcements/admin/delete/${announcementToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAnnouncements();
        showToast("success", `Announcement "${announcementToDelete.title}" deleted.`);
        setAnnouncementToDelete(null);
        return;
      }
    } catch (err) {
      console.log("DELETE /api/announcements notice:", err);
    }

    const updated = announcements.filter((a) => a.id !== announcementToDelete.id);
    setAnnouncements(updated);
    saveStoredAnnouncements(updated);
    showToast("success", `Announcement "${announcementToDelete.title}" deleted.`);
    setAnnouncementToDelete(null);
  };

  // USERS API HANDLERS (GET /api/users & DELETE /api/users/admin/delete/{id})
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((u: any) => ({
            id: u.id ?? u.Id,
            username: u.username ?? u.Username ?? "",
            full_name: u.fullName ?? u.full_name ?? u.FullName ?? u.username ?? "Customer",
            phone_number: u.phoneNumber ?? u.phone_number ?? u.PhoneNumber ?? "N/A",
            address: u.address ?? u.Address ?? "N/A",
            role: u.role ?? u.Role ?? "customer",
          }));
          setUsersList(formatted);
          setLoadingUsers(false);

          // Auto-select first contact for chat if none selected
          if (formatted.length > 0) {
            const currentUser = (user as any)?.username || "WholeSome";
            const target = formatted.find((u: any) => u.username.toLowerCase() !== currentUser.toLowerCase()) || formatted[0];
            setSelectedChatUser((prev) => prev || target);
          }
          return;
        }
      }
    } catch (err) {
      console.log("GET /api/users notice:", err);
    }
    setLoadingUsers(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (
      (userToDelete.role || "").toLowerCase() === "admin" ||
      (userToDelete.username || "").toLowerCase() === "wholesome"
    ) {
      showToast("error", "Cannot delete the primary Admin account.");
      setUserToDelete(null);
      return;
    }

    try {
      const res = await fetch(`/api/users/admin/delete/${userToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("success", `User "@${userToDelete.username}" deleted.`);
        await fetchUsers();
        setUserToDelete(null);
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        showToast("error", data?.message || "Failed to delete user.");
      }
    } catch (err) {
      console.log("DELETE /api/users notice:", err);
    }

    const updated = usersList.filter((u) => u.id !== userToDelete.id);
    setUsersList(updated);
    showToast("success", `User "@${userToDelete.username}" deleted.`);
    setUserToDelete(null);
  };

  // Toast Notification
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fallbackProducts: Product[] = [
    {
      id: 1,
      name: "Artisan Chocolate Donut",
      base_price: 4.5,
      unit_type: "Piece",
      image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80",
      is_available: true,
    },
    {
      id: 2,
      name: "Wholesome Berry Cheesecake",
      base_price: 28.0,
      unit_type: "Whole Cake",
      image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80",
      is_available: true,
    },
    {
      id: 3,
      name: "Velvet Cinnamon Roll",
      base_price: 3.75,
      unit_type: "Piece",
      image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
      is_available: true,
    },
    {
      id: 4,
      name: "Golden Honey Croissant",
      base_price: 3.2,
      unit_type: "Piece",
      image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80",
      is_available: false,
    },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (!u.id) {
          u.id = u.username?.toLowerCase() === "wholesome" ? 1 : u.username?.toLowerCase() === "jeicho" ? 2 : 3;
          try { localStorage.setItem("user", JSON.stringify(u)); } catch (e) {}
        }
        setUser(u);
      } catch {
        setUser({ id: 1, username: "Admin", role: "Administrator" });
      }
    } else {
      setUser({ id: 1, username: "Admin", role: "Administrator" });
    }
  }, []);

  // 1. GET /api/products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const stored = loadStoredProducts();

    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mergedMap = new Map<number, Product>();
          stored.forEach((p) => mergedMap.set(p.id, p));
          data.forEach((p: Product) => mergedMap.set(p.id, p));
          const mergedList = Array.from(mergedMap.values()).sort((a, b) => a.id - b.id);

          setProducts(mergedList);
          saveStoredProducts(mergedList);
          setLoadingProducts(false);
          return;
        }
      }
    } catch (err) {
      console.log("GET /api/products network notice:", err);
    }

    setProducts(stored);
    saveStoredProducts(stored);
    setLoadingProducts(false);
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let userRole = "";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role) userRole = String(u.role).toLowerCase();
      } catch (e) {}
    }

    const storedTab = localStorage.getItem("wt_active_tab");
    if (storedTab) {
      setActiveTab(storedTab);
      localStorage.removeItem("wt_active_tab");
    } else if (userRole === "admin" || userRole === "administrator") {
      setActiveTab("orders");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "cart") {
      fetchCart();
    } else if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "announcements") {
      fetchAnnouncements();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  // 2. GET /api/products/{id}/variations
  const handleOpenVariations = async (product: Product) => {
    setSelectedProductForVariations(product);
    setLoadingVariations(true);
    setVariations([]);

    const storedVars = getStoredVariations(product.id);
    if (storedVars.length > 0) {
      setVariations(storedVars);
      setLoadingVariations(false);
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}/variations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVariations(data);
          saveStoredVariations(product.id, data);
        } else {
          setVariations([]);
        }
      } else {
        setVariations([]);
      }
    } catch (err) {
      console.error("GET variations error:", err);
      setVariations([]);
    } finally {
      setLoadingVariations(false);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: "",
      base_price: "",
      unit_type: "Piece",
      image_url: "",
      is_available: true,
    });
    setHasProductVariations(false);
    setProductFormVariations([{ flavor_name: "", price: "" }]);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      base_price: product.base_price.toString(),
      unit_type: product.unit_type || "Piece",
      image_url: product.image_url || "",
      is_available: product.is_available,
    });

    const storedVars = getStoredVariations(product.id);
    if (storedVars.length > 0) {
      setHasProductVariations(true);
      setProductFormVariations(
        storedVars.map((v) => ({ flavor_name: v.flavor_name, price: v.price.toString() }))
      );
    } else {
      setHasProductVariations(false);
      setProductFormVariations([{ flavor_name: "", price: product.base_price.toString() }]);
    }

    setIsProductFormOpen(true);
  };

  // 3. POST /api/products/admin/add & 4. PUT /api/products/admin/update/{id}
  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const basePriceNum = parseFloat(productFormData.base_price) || 0;

    const payload = {
      name: productFormData.name,
      base_price: basePriceNum,
      unit_type: productFormData.unit_type,
      image_url: productFormData.image_url || null,
      is_available: productFormData.is_available,
    };

    const currentList = loadStoredProducts();
    let targetId = editingProduct ? editingProduct.id : 5;

    if (editingProduct) {
      // PUT /api/products/admin/update/{id}
      try {
        await fetch(`/api/products/admin/update/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
      } catch (err) {
        console.log("PUT /api/products update notice:", err);
      }

      const updatedList = currentList
        .map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
        .sort((a, b) => a.id - b.id);

      setProducts(updatedList);
      saveStoredProducts(updatedList);
    } else {
      // POST /api/products/admin/add
      if (currentList.length > 0) {
        targetId = Math.max(...currentList.map((p) => p.id)) + 1;
      }

      try {
        const res = await fetch("/api/products/admin/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.id) targetId = data.id;
        }
      } catch (err) {
        console.log("POST /api/products add notice:", err);
      }

      const newProduct: Product = { id: targetId, ...payload };
      const updatedList = [...currentList.filter((p) => p.id !== targetId), newProduct].sort(
        (a, b) => a.id - b.id
      );

      setProducts(updatedList);
      saveStoredProducts(updatedList);
    }

    // Process Variations
    if (hasProductVariations) {
      const existingVars = getStoredVariations(targetId);
      const validVars: ProductVariation[] = productFormVariations
        .filter((v) => v.flavor_name.trim() !== "")
        .map((v, i) => {
          const matched = existingVars.find(
            (ev) => ev.flavor_name.toLowerCase() === v.flavor_name.trim().toLowerCase()
          );
          return {
            id: matched ? matched.id : i + 1,
            product_id: targetId,
            flavor_name: v.flavor_name.trim(),
            price: parseFloat(v.price) || basePriceNum,
          };
        });

      saveStoredVariations(targetId, validVars);
    } else {
      saveStoredVariations(targetId, []);
    }

    showToast(
      "success",
      editingProduct
        ? `Product "${productFormData.name}" updated successfully!`
        : `Product "${productFormData.name}" added successfully (#${targetId})!`
    );
    setIsProductFormOpen(false);
  };

  // 5. DELETE /api/products/admin/delete/{id}
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const token = localStorage.getItem("token");

    try {
      await fetch(`/api/products/admin/delete/${productToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
    } catch (err) {
      console.log("DELETE product notice:", err);
    }

    const currentList = loadStoredProducts();
    const updatedList = currentList.filter((p) => p.id !== productToDelete.id);
    setProducts(updatedList);
    saveStoredProducts(updatedList);
    showToast("success", `Product "${productToDelete.name}" deleted.`);
    setProductToDelete(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/users/admin/role/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        showToast("success", `User role updated to '${newRole}'.`);
        await fetchUsers();
        if (user && (user as any).id === userId) {
          const updatedUser = { ...user, role: newRole };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        return;
      }
    } catch (err) {
      console.log("PUT /api/users/admin/role notice:", err);
    }
    const updated = usersList.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    setUsersList(updated);
    showToast("success", `User role updated to '${newRole}'.`);
  };

  const [messagesList, setMessagesList] = useState<ChatMessage[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<UserItem | null>(null);
  const [chatInputText, setChatInputText] = useState("");
  const [chatImageAttachment, setChatImageAttachment] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessagesList(loadStoredMessages());
  }, []);

  useEffect(() => {
    if (activeTab === "messages" && !selectedChatUser && usersList.length > 0) {
      setSelectedChatUser(usersList[0]);
    }
  }, [activeTab, usersList, selectedChatUser]);

  const handleSelectChatImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatImageAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() && !chatImageAttachment) return;

    const currentUserId = (user as any)?.id || (isAdmin ? 1 : 4);
    const currentUserName = user?.username || (isAdmin ? "WholeSome" : "Jeicho");

    let recipientId = 1;
    let recipientName = "WholeSome";

    if (isAdmin) {
      if (!selectedChatUser) return;
      recipientId = selectedChatUser.id;
      recipientName = selectedChatUser.full_name || selectedChatUser.username;
    }

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender_id: currentUserId,
      sender_name: currentUserName,
      receiver_id: recipientId,
      receiver_name: recipientName,
      content: chatInputText.trim(),
      ...(chatImageAttachment ? { image_url: chatImageAttachment } : {}),
      created_at: new Date().toISOString(),
    };

    const updated = [...messagesList, newMessage];
    setMessagesList(updated);
    saveStoredMessages(updated);
    setChatInputText("");
    setChatImageAttachment(null);
  };

  const openDirectMessageWithUser = (u: UserItem) => {
    setSelectedChatUser(u);
    setActiveTab("messages");
  };

  const isAdmin =
    (user?.role || "").toLowerCase() === "admin" ||
    (user?.role || "").toLowerCase() === "administrator" ||
    (user?.role || "") === "1" ||
    user?.username?.toLowerCase() === "wholesome";

  const navItems = [
    { id: "products", label: "Products", icon: "📦" },
    ...(!isAdmin ? [{ id: "cart", label: "Cart", icon: "🛒", badge: cart.reduce((sum, item) => sum + item.quantity, 0) }] : []),
    { id: "orders", label: isAdmin ? "Orders" : "My Orders", icon: "📋" },
    { id: "announcements", label: "Announcements", icon: "📢" },
    { id: "messages", label: "Messages", icon: "💬" },
    ...(isAdmin ? [{ id: "users", label: "Users", icon: "👥" }] : []),
  ];

  const recentOrders = [
    { id: "#ORD-9021", customer: "Sarah Jenkins", date: "2026-09-25", amount: "$142.50", status: "Completed" },
    { id: "#ORD-9020", customer: "Michael Chen", date: "2026-09-25", amount: "$89.00", status: "Processing" },
    { id: "#ORD-9019", customer: "Emily Davis", date: "2026-09-24", amount: "$210.75", status: "Completed" },
    { id: "#ORD-9018", customer: "James Wilson", date: "2026-09-24", amount: "$45.20", status: "Pending" },
    { id: "#ORD-9017", customer: "Amanda Torres", date: "2026-09-23", amount: "$320.00", status: "Completed" },
  ];

  const dashboardAnnouncements = [
    { id: 1, title: "Weekend Promotion Discount", date: "Sep 24", category: "Marketing" },
    { id: 2, title: "System Maintenance Scheduled at Midnight", date: "Sep 23", category: "System" },
    { id: 3, title: "New Artisan Bakery Products Added", date: "Sep 22", category: "Products" },
  ];

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-stone-900 flex font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
              toast.type === "success"
                ? "bg-emerald-900 text-emerald-100 border-emerald-500/40"
                : "bg-rose-900 text-rose-100 border-rose-500/40"
            }`}
          >
            <span>{toast.type === "success" ? "🎉" : "❌"}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-stone-900 text-stone-100 border-r border-stone-800 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-600/30 shrink-0">
                W
              </div>
              {!collapsed && (
                <span className="font-extrabold text-white text-lg tracking-tight whitespace-nowrap">
                  Wholesome<span className="text-orange-500">Treats</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "⏩" : "⏪"}
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                    active
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30 font-bold"
                      : "text-stone-400 hover:text-white hover:bg-stone-800/80"
                  }`}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform shrink-0">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="whitespace-nowrap tracking-wide flex-1 text-left">{item.label}</span>
                  )}
                  {isMounted && typeof item.badge === "number" && item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-orange-500 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {active && !collapsed && !item.badge && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile Card */}
        <div className="p-3 border-t border-stone-800">
          <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : "AD"}
              </div>
              {!collapsed && (
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-semibold text-stone-200 truncate">
                    {user?.username || "Admin User"}
                  </p>
                  <p className="text-[10px] text-orange-400 font-mono capitalize truncate">
                    {user?.role || "Administrator"}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              >
                🚪
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN WRAPPER AREA */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* TOP DASHBOARD HEADER BAR */}
        <header className="h-16 border-b border-orange-200/60 bg-[#FDF8F3]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900"
            >
              ☰
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === "products" ? (
            /* PRODUCTS MANAGEMENT VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="Search products by name..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-orange-200 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm font-medium"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                    🔍
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isAdmin && (
                    <button
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer mr-1"
                    >
                      <span>+ Add Product</span>
                    </button>
                  )}
                </div>
              </div>

              {/* PRODUCTS DISPLAY */}
              {loadingProducts ? (
                <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
                  <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-xs font-bold text-stone-600">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
                  <p className="text-stone-500 text-sm font-bold">No products found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-orange-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-400 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-44 bg-orange-100 relative overflow-hidden flex items-center justify-center">
                          <img
                            src={getCategoryImageUrl(p)}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span
                            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              p.is_available
                                ? "bg-emerald-500 text-white shadow"
                                : "bg-stone-500 text-white"
                            }`}
                          >
                            {p.is_available ? "In Stock" : "Unavailable"}
                          </span>
                        </div>

                        <div className="p-5 space-y-2">
                          <h3 className="font-bold text-stone-900 text-base line-clamp-1">{p.name}</h3>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-stone-500 font-medium">Unit: {p.unit_type}</span>
                            <span className="text-lg font-black text-orange-600">
                              ₱{p.base_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-2">
                        <button
                          onClick={() => handleOpenVariations(p)}
                          className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🔍 View Variations</span>
                        </button>

                        {!isAdmin && (
                          <button
                            onClick={() => handleOpenOrderModal(p)}
                            className="w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/20 active:scale-95"
                          >
                            <span>🛒 Add to Cart</span>
                          </button>
                        )}

                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "cart" ? (
            /* CART VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span>🛒 Your Shopping Cart</span>
                    {cart.length > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">
                        {cart.reduce((s, i) => s + i.quantity, 0)} Items
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Review your items, choose delivery details, and proceed to checkout.
                  </p>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 text-xs font-bold border border-stone-200 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🗑️</span>
                    <span>Clear Cart</span>
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="bg-white border border-orange-200/80 rounded-3xl p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto my-8">
                  <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-4xl mx-auto border border-orange-200">
                    🛒
                  </div>
                  <h3 className="text-lg font-black text-stone-900">Your Cart is Empty</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Looks like you haven't added any delicious treats to your cart yet. Explore our freshly baked products!
                  </p>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>🍰 Browse Products</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* CART ITEMS LIST */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-orange-200/80 rounded-3xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-stone-100">
                        {cart.map((item) => (
                          <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-orange-50/30 transition">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className="w-16 h-16 rounded-2xl bg-orange-100 border border-orange-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-2xl">🍰</span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{item.product_name}</h4>
                                {item.flavor_name && (
                                  <p className="text-xs text-orange-600 font-semibold mt-0.5">Flavor: {item.flavor_name}</p>
                                )}
                                <p className="text-xs text-stone-400 mt-0.5">₱{item.price.toFixed(2)} / item</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                              {/* QUANTITY CONTROLS */}
                              <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                                <button
                                  onClick={() => handleCartQuantityChange(item.id, -1)}
                                  className="px-3 py-1 text-stone-600 hover:bg-stone-200 font-bold transition text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 font-bold text-stone-900 text-xs bg-white border-x border-stone-200">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleCartQuantityChange(item.id, 1)}
                                  className="px-3 py-1 text-stone-600 hover:bg-stone-200 font-bold transition text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              {/* SUBTOTAL & REMOVE */}
                              <div className="text-right shrink-0 min-w-[80px]">
                                <span className="block font-black text-stone-900 text-sm">
                                  ₱{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>

                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                title="Remove Item"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ORDER SUMMARY & CHECKOUT CARD */}
                  <div className="space-y-4">
                    <div className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm space-y-5 sticky top-24">
                      <h3 className="font-black text-stone-900 text-base border-b border-stone-100 pb-3">Order Summary</h3>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between text-stone-600 font-medium">
                          <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                          <span className="font-bold text-stone-900">
                            ₱{cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-stone-600 font-medium">
                          <span>Delivery Fee</span>
                          <span className="font-bold text-stone-900">₱50.00</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-600 font-medium">
                          <span>Payment Method</span>
                          <span className="font-bold text-stone-900">Cash on Delivery (COD)</span>
                        </div>

                        <div className="border-t border-stone-100 pt-3 space-y-3">
                          <div>
                            <label className="block text-stone-700 font-bold mb-1">Delivery Address</label>
                            <input
                              type="text"
                              value={cartDeliveryAddress}
                              onChange={(e) => setCartDeliveryAddress(e.target.value)}
                              placeholder="Enter your delivery address..."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-stone-700 font-bold mb-1">Preferred Delivery Date</label>
                            <input
                              type="date"
                              value={cartDeliveryDate}
                              onChange={(e) => setCartDeliveryDate(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium text-xs"
                            />
                          </div>
                        </div>

                        <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-sm">
                          <span className="font-extrabold text-stone-900">Total Amount</span>
                          <span className="font-black text-lg text-orange-600">
                            ₱{(cart.reduce((s, i) => s + i.price * i.quantity, 0) + 50).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleCheckoutCart}
                        disabled={isCheckingOutCart}
                        className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xl shadow-orange-600/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {isCheckingOutCart ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>Processing Order...</span>
                          </>
                        ) : (
                          <>
                            <span>🛍️</span>
                            <span>Proceed to Checkout</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "orders" ? (
            /* ORDERS MANAGEMENT VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* CONTROLS BAR */}
              {isAdmin && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* SEARCH ORDER */}
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      value={searchOrder}
                      onChange={(e) => setSearchOrder(e.target.value)}
                      placeholder="Search order ID or customer..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-orange-200 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm font-medium"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                      🔍
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                  </div>
                </div>
              )}

              {/* ORDERS TABLE VIEW */}
              {loadingOrders ? (
                <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
                  <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-xs font-bold text-stone-600">Loading orders...</p>
                </div>
              ) : orders.filter((o) => {
                  if (!isAdmin && user) {
                    const uName = user.full_name || user.username || "Customer";
                    if (!o.customer_name || o.customer_name.startsWith("Customer #")) {
                      o.customer_name = uName;
                    }
                  }
                  return (
                    searchOrder === "" ||
                    (o.customer_name || "").toLowerCase().includes(searchOrder.toLowerCase()) ||
                    (o.customer_address || "").toLowerCase().includes(searchOrder.toLowerCase())
                  );
                }).length === 0 ? (
                <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
                  <p className="text-stone-500 text-sm font-bold">No orders found.</p>
                </div>
              ) : (
                <div className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {orders
                        .filter((o) => {
                          if (!isAdmin && user) {
                            const isUserMatch =
                              o.user_id === user.id ||
                              (user.full_name && o.customer_name?.toLowerCase() === user.full_name.toLowerCase()) ||
                              (user.username && o.customer_name?.toLowerCase() === user.username.toLowerCase());
                            if (!isUserMatch) return false;
                          }
                          return (
                            searchOrder === "" ||
                            (o.customer_name || "").toLowerCase().includes(searchOrder.toLowerCase()) ||
                            (o.customer_address || "").toLowerCase().includes(searchOrder.toLowerCase())
                          );
                        })
                        .map((o) => {
                          return (
                            <tr key={o.id} className="hover:bg-orange-50/50 transition">
                              <td className="py-3.5 font-bold">{o.customer_name || `Customer #${o.user_id}`}</td>
                              <td className="py-3.5">
                                {isAdmin ? (
                                  <select
                                    value={o.status}
                                    onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                                      o.status === "Completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                        : o.status === "Delivering"
                                        ? "bg-blue-50 text-blue-700 border-blue-300"
                                        : "bg-amber-50 text-amber-800 border-amber-300"
                                    }`}
                                  >
                                    <option value="Processing">Processing</option>
                                    <option value="Delivering">Delivering</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                      o.status === "Completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                        : o.status === "Delivering"
                                        ? "bg-blue-50 text-blue-700 border-blue-300"
                                        : "bg-amber-50 text-amber-800 border-amber-300"
                                    }`}
                                  >
                                    {o.status}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 text-right space-x-2">
                                {isAdmin && (
                                  <button
                                    onClick={() => {
                                      const targetUser: UserItem = usersList.find(
                                        (u) =>
                                          u.id === o.user_id ||
                                          (u.full_name && u.full_name.toLowerCase() === o.customer_name?.toLowerCase()) ||
                                          (u.username && u.username.toLowerCase() === o.customer_name?.toLowerCase())
                                      ) || {
                                        id: o.user_id || 2,
                                        username: o.customer_name || `Customer #${o.user_id}`,
                                        full_name: o.customer_name || `Customer #${o.user_id}`,
                                        phone_number: "N/A",
                                        address: o.customer_address || "Olongapo City",
                                        role: "Customer",
                                      };
                                      openDirectMessageWithUser(targetUser);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold cursor-pointer transition"
                                  >
                                    Message
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedOrderDetails(o)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                                >
                                  Details
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => setOrderToDelete(o)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-sm transition"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === "announcements" ? (
            /* ANNOUNCEMENTS MANAGEMENT VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchAnnouncement}
                    onChange={(e) => setSearchAnnouncement(e.target.value)}
                    placeholder="Search announcements..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-orange-200 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm font-medium"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                    🔍
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setIsAddAnnouncementOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
                  >
                    <span>+ Post Announcement</span>
                  </button>
                )}
              </div>

              {/* ANNOUNCEMENTS GRID */}
              {loadingAnnouncements ? (
                <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
                  <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-xs font-bold text-stone-600">Loading announcements...</p>
                </div>
              ) : announcements.filter((a) =>
                  searchAnnouncement === "" ||
                  a.title.toLowerCase().includes(searchAnnouncement.toLowerCase()) ||
                  a.content.toLowerCase().includes(searchAnnouncement.toLowerCase())
                ).length === 0 ? (
                <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
                  <p className="text-stone-500 text-sm font-bold">No announcements found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {announcements
                    .filter((a) =>
                      searchAnnouncement === "" ||
                      a.title.toLowerCase().includes(searchAnnouncement.toLowerCase()) ||
                      a.content.toLowerCase().includes(searchAnnouncement.toLowerCase())
                    )
                    .map((ann) => (
                      <div
                        key={ann.id}
                        className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-black text-stone-900 leading-snug">{ann.title}</h3>
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-bold shrink-0">
                              {new Date(ann.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 font-medium leading-relaxed whitespace-pre-line">
                            {ann.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                          <span className="font-mono text-[10px] text-stone-400 font-bold">
                            ID: #{ann.id}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => setAnnouncementToDelete(ann)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 cursor-pointer transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : activeTab === "messages" ? (
            /* LIVE MESSAGING CHAT VIEW */
            <div className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 min-h-[580px] animate-in fade-in duration-200">
              {/* CONTACTS LIST */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-stone-200 pb-4 md:pb-0 md:pr-6 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-stone-900">Conversations</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-bold">
                    💬 Live Chat
                  </span>
                </div>

                {isAdmin ? (
                  <div className="space-y-2 overflow-y-auto max-h-[480px]">
                    {usersList.length === 0 ? (
                      <p className="text-xs text-stone-500 font-medium">No customer contacts found.</p>
                    ) : (
                      usersList.map((u) => {
                        const isSelected = selectedChatUser?.id === u.id;
                        const userMsgs = messagesList.filter(
                          (m) =>
                            (m.sender_id === u.id && m.receiver_id === ((user as any)?.id || 1)) ||
                            (m.sender_id === ((user as any)?.id || 1) && m.receiver_id === u.id)
                        );
                        const lastMsg = userMsgs[userMsgs.length - 1];

                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedChatUser(u)}
                            className={`p-3 rounded-2xl cursor-pointer transition flex items-center gap-3 border ${
                              isSelected
                                ? "bg-orange-600 text-white border-orange-600 shadow-md"
                                : "bg-stone-50 hover:bg-orange-50 border-stone-200 text-stone-900"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                isSelected ? "bg-white text-orange-600" : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {(u.full_name || u.username)[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold truncate">{u.full_name || u.username}</p>
                                <span className={`text-[10px] ${isSelected ? "text-orange-100" : "text-stone-400"}`}>
                                  @{u.username}
                                </span>
                              </div>
                              <p className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-orange-100" : "text-stone-500"}`}>
                                {lastMsg ? lastMsg.content : "Click to chat..."}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                      W
                    </div>
                    <div>
                      <p className="text-sm font-black text-stone-900">WholesomeTreats Bakery</p>
                      <p className="text-xs text-orange-700 font-medium">Bakery Owner & Support</p>
                    </div>
                  </div>
                )}
              </div>

              {/* CHAT MESSAGES PANEL */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* CHAT HEADER */}
                <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-stone-900">
                      {isAdmin
                        ? selectedChatUser
                          ? `Messaging with ${selectedChatUser.full_name || selectedChatUser.username} (@${selectedChatUser.username})`
                          : "Select a customer to start chatting"
                        : "Chatting with Bakery Owner (WholeSome)"}
                    </h4>
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Session
                    </p>
                  </div>
                </div>

                {/* MESSAGES THREAD BUBBLES */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] p-3 bg-stone-50/60 rounded-2xl border border-stone-100">
                  {(() => {
                    const currentUserId = (user as any)?.id || (isAdmin ? 1 : 4);
                    const activeChatRecipientId = isAdmin ? (selectedChatUser ? selectedChatUser.id : 4) : 1;

                    const activeThread = messagesList.filter(
                      (m) =>
                        (m.sender_id === currentUserId && m.receiver_id === activeChatRecipientId) ||
                        (m.sender_id === activeChatRecipientId && m.receiver_id === currentUserId)
                    );

                    if (activeThread.length === 0) {
                      return (
                        <div className="text-center py-16 text-stone-400 text-xs font-medium">
                          💬 No messages in this thread yet. Send a message to start chatting!
                        </div>
                      );
                    }

                    return activeThread.map((msg) => {
                      const isMe = msg.sender_id === currentUserId || msg.sender_name.toLowerCase() === (user?.username || "").toLowerCase();
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-md px-4 py-2.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                              isMe
                                ? "bg-orange-600 text-white rounded-br-none"
                                : "bg-white text-stone-800 border border-orange-200/80 rounded-bl-none"
                            }`}
                          >
                            <p className="font-bold text-[10px] mb-0.5 opacity-80">
                              {isMe ? "You" : msg.sender_name}
                            </p>
                            {msg.content && <p>{msg.content}</p>}
                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="Shared photo"
                                className="max-w-xs max-h-60 rounded-xl mt-1.5 object-cover border border-stone-200/60 shadow-sm"
                              />
                            )}
                          </div>
                          <span className="text-[9px] text-stone-400 mt-1 px-1 font-mono">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* MESSAGES INPUT FORM */}
                <form onSubmit={handleSendMessage} className="space-y-2">
                  {chatImageAttachment && (
                    <div className="relative inline-block border border-orange-300 rounded-2xl p-1 bg-white shadow-sm">
                      <img
                        src={chatImageAttachment}
                        alt="Attachment preview"
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setChatImageAttachment(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center cursor-pointer shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={chatFileInputRef}
                      onChange={handleSelectChatImage}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      disabled={isAdmin && !selectedChatUser}
                      title="Attach picture"
                      className="px-3.5 py-3 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold transition text-sm cursor-pointer disabled:opacity-50"
                    >
                      📷
                    </button>
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder={
                        isAdmin && !selectedChatUser
                          ? "Select a customer from the left list to message..."
                          : "Type your message here..."
                      }
                      disabled={isAdmin && !selectedChatUser}
                      className="flex-1 px-4 py-3 rounded-xl bg-white border border-orange-200 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm font-medium disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isAdmin && !selectedChatUser}
                      className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>Send</span>
                      <span>➔</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : activeTab === "users" ? (
            /* USERS MANAGEMENT VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Search users by name, username, or phone..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-orange-200 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:border-orange-500 shadow-sm font-medium"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                    🔍
                  </span>
                </div>

                <div className="px-4 py-2 rounded-xl bg-stone-900 text-stone-200 text-xs font-bold shadow-sm flex items-center gap-2">
                  <span>👥 Registered Customers:</span>
                  <span className="text-orange-400 font-black text-sm">{usersList.length}</span>
                </div>
              </div>

              {/* USERS DATAGRID TABLE */}
              <div className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm overflow-hidden">
                {loadingUsers ? (
                  <div className="text-center py-16">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-xs font-bold text-stone-600">Loading registered users from database...</p>
                  </div>
                ) : usersList.filter((u) =>
                    searchUser === "" ||
                    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
                    u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
                    u.phone_number.includes(searchUser)
                  ).length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-stone-500 text-sm font-bold">No registered users found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-orange-100 text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                          <th className="pb-3">User ID</th>
                          <th className="pb-3">Customer Name</th>
                          <th className="pb-3">Username</th>
                          <th className="pb-3">Phone Number</th>
                          <th className="pb-3">Address</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                        {usersList
                          .filter((u) =>
                            searchUser === "" ||
                            u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
                            u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
                            u.phone_number.includes(searchUser)
                          )
                          .map((u) => (
                            <tr key={u.id} className="hover:bg-orange-50/50 transition">
                              <td className="py-3.5 font-bold text-orange-600 font-mono">
                                #{u.id}
                              </td>
                              <td className="py-3.5 font-bold text-stone-900">
                                {u.full_name || u.username}
                              </td>
                              <td className="py-3.5 text-stone-500 font-mono">
                                @{u.username}
                              </td>
                              <td className="py-3.5 text-stone-600 font-mono">
                                {u.phone_number || "N/A"}
                              </td>
                              <td className="py-3.5 text-stone-600 truncate max-w-xs">
                                {u.address || "N/A"}
                              </td>
                              <td className="py-3.5">
                                <select
                                  value={u.role}
                                  onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase border focus:outline-none cursor-pointer transition ${
                                    (u.role || "").toLowerCase() === "admin"
                                      ? "bg-purple-50 text-purple-700 border-purple-300"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  }`}
                                >
                                  <option value="customer">CUSTOMER</option>
                                  <option value="Admin">ADMIN</option>
                                </select>
                              </td>
                              <td className="py-3.5 text-right space-x-2">
                                <button
                                  onClick={() => openDirectMessageWithUser(u)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer transition"
                                >
                                  Message
                                </button>
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 cursor-pointer transition"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* DASHBOARD OVERVIEW VIEW */
            <div className="space-y-6">
              {/* WELCOME BANNER (12-column grid full span) */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white border border-orange-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-orange-600/10">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3">
                        🍩 WholesomeTreats Dashboard
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Welcome back, {user?.username || "Admin"}!
                      </h1>
                      <p className="text-orange-100 text-xs sm:text-sm mt-1">
                        Delight in every bite — manage products, orders, and customer insights.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block bg-black/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                        <p className="text-[10px] text-orange-200 uppercase font-semibold">System Date</p>
                        <p className="text-sm font-mono text-white font-bold">
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI METRIC CARDS (12-Column Grid: 4 cards) */}
              <div className="grid grid-cols-12 gap-6">
                {/* KPI 1 */}
                <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-orange-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-400 transition duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-500">Total Revenue</span>
                    <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-base">
                      💵
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-stone-900">₱24,850.00</span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                      ↑ +12.5%
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2">vs. previous month (₱22,080)</p>
                </div>

                {/* KPI 2 */}
                <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-orange-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-400 transition duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-500">Active Orders</span>
                    <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-base">
                      📦
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-stone-900">142</span>
                    <span className="text-xs text-orange-600 font-bold flex items-center gap-0.5">
                      ↑ +8.2%
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2">18 pending fulfillment</p>
                </div>

                {/* KPI 3 */}
                <div
                  onClick={() => setActiveTab("products")}
                  className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-orange-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-400 transition duration-300 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-500 group-hover:text-orange-600 transition">
                      Products Catalog →
                    </span>
                    <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-base">
                      🍰
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-stone-900">
                      {products.length > 0 ? products.length : 84}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">In Stock</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2">Click to manage products</p>
                </div>

                {/* KPI 4 */}
                <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-orange-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-400 transition duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-500">Total Users</span>
                    <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-base">
                      👥
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-stone-900">1,250</span>
                    <span className="text-xs text-emerald-600 font-bold">↑ +24 new</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2">Registered accounts</p>
                </div>
              </div>

              {/* MAIN CONTENT ROW (12-Column Grid) */}
              <div className="grid grid-cols-12 gap-6">
                {/* RECENT ORDERS TABLE (col-span-12 lg:col-span-8) */}
                <div className="col-span-12 lg:col-span-8 bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-base font-black text-stone-900">Recent Orders</h2>
                        <p className="text-xs text-stone-500">Latest customer purchases</p>
                      </div>
                      <button className="text-xs text-orange-600 hover:text-orange-500 font-bold">
                        View All →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-400 font-semibold">
                            <th className="pb-3">Order ID</th>
                            <th className="pb-3">Customer</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Amount</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-800">
                          {recentOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-orange-50/50 transition">
                              <td className="py-3.5 font-mono font-bold text-orange-600">
                                {ord.id}
                              </td>
                              <td className="py-3.5 font-semibold">{ord.customer}</td>
                              <td className="py-3.5 text-stone-500">{ord.date}</td>
                              <td className="py-3.5 font-bold text-stone-900">{ord.amount}</td>
                              <td className="py-3.5">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    ord.status === "Completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : ord.status === "Processing"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* SIDEBAR ANNOUNCEMENTS (col-span-12 lg:col-span-4) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                        <span>📢</span> Announcements
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {dashboardAnnouncements.map((ann) => (
                        <div
                          key={ann.id}
                          className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 hover:border-orange-300 transition"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-200 text-orange-900 font-bold">
                              {ann.category}
                            </span>
                            <span className="text-[10px] text-stone-400">{ann.date}</span>
                          </div>
                          <p className="text-xs font-semibold text-stone-800">{ann.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* VARIATIONS MODAL */}
      {selectedProductForVariations && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  {selectedProductForVariations.name} Variations
                </h3>
              </div>
              <button
                onClick={() => setSelectedProductForVariations(null)}
                className="text-stone-400 hover:text-stone-700 p-1 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingVariations ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-3 border-orange-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-bold">Loading variations...</p>
              </div>
            ) : variations.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6 font-medium">
                No flavor variations found for this product.
              </p>
            ) : (
              <div className="space-y-2.5">
                {variations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/60 border border-orange-100"
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-800">{v.flavor_name}</p>
                    </div>
                    <span className="text-sm font-black text-orange-600">
                      ₱{v.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedProductForVariations(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductFormOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-stone-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsProductFormOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productFormData.name}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, name: e.target.value })
                  }
                  placeholder="e.g. Chocolate Donut"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">Base Price (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productFormData.base_price}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, base_price: e.target.value })
                    }
                    placeholder="45.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">Unit Type *</label>
                  <select
                    value={productFormData.unit_type}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, unit_type: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Piece">Piece</option>
                    <option value="Box">Box</option>
                    <option value="Whole Cake">Whole Cake</option>
                    <option value="Dozen">Dozen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 mb-1">Product Image</label>
                <input
                  type="file"
                  ref={productFileInputRef}
                  onChange={handleSelectProductImage}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={productFormData.image_url}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, image_url: e.target.value })
                    }
                    placeholder="e.g. /images/newyork_cheesecake.jpg or click Browse..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 cursor-pointer shrink-0 transition flex items-center gap-1.5"
                  >
                    <span>📁</span>
                    <span>Browse Image</span>
                  </button>
                </div>
                {productFormData.image_url && (
                  <div className="mt-2.5 relative inline-block border border-orange-200 rounded-2xl p-1.5 bg-white shadow-sm">
                    <img
                      src={productFormData.image_url}
                      alt="Product preview"
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, image_url: "" })}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center cursor-pointer shadow-md hover:bg-rose-500 transition"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAvailableDash"
                  checked={productFormData.is_available}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, is_available: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="chkAvailableDash" className="text-stone-700 cursor-pointer">
                  Product is Available in Store
                </label>
              </div>

              {/* DYNAMIC VARIATIONS CHECKBOX & FIELDS */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="chkVariationsDash" className="flex items-center gap-2 text-stone-800 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      id="chkVariationsDash"
                      checked={hasProductVariations}
                      onChange={(e) => {
                        setHasProductVariations(e.target.checked);
                        if (e.target.checked && productFormVariations.length === 0) {
                          setProductFormVariations([{ flavor_name: "", price: productFormData.base_price || "0" }]);
                        }
                      }}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Add Product Variations / Flavors</span>
                  </label>
                </div>

                {hasProductVariations && (
                  <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-700 font-bold">
                      <span>Flavor Variations & Pricing</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProductFormVariations([
                            ...productFormVariations,
                            { flavor_name: "", price: productFormData.base_price || "0" },
                          ])
                        }
                        className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Add Flavor</span>
                      </button>
                    </div>

                    {productFormVariations.map((varItem, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Flavor Name (e.g. Salted Caramel)"
                          value={varItem.flavor_name}
                          onChange={(e) => {
                            const updated = [...productFormVariations];
                            updated[idx].flavor_name = e.target.value;
                            setProductFormVariations(updated);
                          }}
                          className="flex-2 px-3 py-2 rounded-xl bg-white border border-orange-200 text-stone-900 font-medium"
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={varItem.price}
                            onChange={(e) => {
                              const updated = [...productFormVariations];
                              updated[idx].price = e.target.value;
                              setProductFormVariations(updated);
                            }}
                            className="w-full pl-7 pr-2 py-2 rounded-xl bg-white border border-orange-200 text-stone-900 font-medium"
                          />
                        </div>
                        {productFormVariations.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setProductFormVariations(productFormVariations.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md shadow-orange-600/30 cursor-pointer"
                >
                  {editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (DELETE /api/products/admin/delete/{id}) */}
      {productToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              🗑️
            </div>
            <h3 className="text-base font-black text-stone-900 mb-1">Delete Product?</h3>
            <p className="text-xs text-stone-500 mb-4 font-medium">
              Are you sure you want to delete <strong>"{productToDelete.name}"</strong>?
              <br />
              <span className="font-mono text-[10px] text-rose-600 font-bold">
                DELETE /api/products/admin/delete/{productToDelete.id}
              </span>
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Delete (DELETE)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-black text-stone-900">Order Details</h3>
                <p className="text-xs text-stone-500 font-medium">
                  Placed on {new Date(selectedOrderDetails.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px] block">Customer</span>
                <span className="font-bold text-stone-900">{selectedOrderDetails.customer_name || `User #${selectedOrderDetails.user_id}`}</span>
              </div>
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px] block">Payment Method</span>
                <span className="font-bold text-stone-900">{selectedOrderDetails.payment_method || "COD"}</span>
              </div>
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px] block">Status</span>
                <span className="font-bold text-orange-600">{selectedOrderDetails.status}</span>
              </div>
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px] block">Delivery Date</span>
                <span className="font-bold text-stone-900">
                  {formatDeliveryDate(selectedOrderDetails.delivery_date, selectedOrderDetails.created_at)}
                </span>
              </div>
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px] block">Address</span>
                <span className="font-bold text-stone-900 truncate block" title={selectedOrderDetails.customer_address || "Olongapo City"}>
                  {selectedOrderDetails.customer_address || "Olongapo City"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Purchased Items</h4>
              {(() => {
                const itemsList =
                  selectedOrderDetails.items && selectedOrderDetails.items.length > 0
                    ? selectedOrderDetails.items
                    : loadStoredOrders().find((o) => o.id === selectedOrderDetails.id)?.items || [];

                const finalItems =
                  itemsList.length > 0
                    ? itemsList
                    : [
                        {
                          id: 1,
                          product_id: 1,
                          product_name: "Chocolate Chip Cookies",
                          flavor_name: "Original",
                          quantity: 1,
                          price_at_purchase: Math.max(45, Number(selectedOrderDetails.total_amount || 0) - 50) || 190.00,
                          unit_type: "box",
                        },
                      ];

                const itemsSubtotal = finalItems.reduce(
                  (sum, it) => sum + Number(it.quantity) * Number(it.price_at_purchase),
                  0
                );
                const deliveryFee = 50;
                const grandTotal = itemsSubtotal + deliveryFee;

                return (
                  <div className="space-y-3">
                    <div className="divide-y divide-stone-100 max-h-40 overflow-y-auto pr-1">
                      {finalItems.map((it, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-stone-800">
                              {it.product_name || `Product #${it.product_id}`}
                              {it.flavor_name ? <span className="ml-1.5 text-xs text-orange-600 font-semibold">({it.flavor_name})</span> : null}
                            </p>
                            <p className="text-[11px] text-stone-500 font-medium">
                              Qty: {it.quantity} {it.unit_type || "pc"} × ₱{Number(it.price_at_purchase).toFixed(2)}
                            </p>
                          </div>
                          <span className="font-mono font-black text-stone-900">
                            ₱{(Number(it.quantity) * Number(it.price_at_purchase)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-stone-600 font-medium">
                        <span>Items Subtotal</span>
                        <span className="font-mono font-bold">₱{itemsSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <span>Delivery Fee</span>
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">Fixed</span>
                        </div>
                        <span className="font-mono font-bold">₱{deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between font-black text-stone-900 text-sm pt-2 border-t border-dashed border-stone-200">
                        <span>Total Amount</span>
                        <span className="font-mono text-orange-600 text-base">₱{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-stone-100 text-right">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT TEST ORDER MODAL (POST /api/orders/checkout - Non-Admin Customers Only) */}
      {!isAdmin && isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Place New Order (Checkout)</h3>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select Product</label>
                <select
                  value={checkoutProductId}
                  onChange={(e) => setCheckoutProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:border-orange-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₱{p.base_price.toFixed(2)} / {p.unit_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={checkoutQuantity}
                  onChange={(e) => setCheckoutQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-600">Total Order Price:</span>
                <span className="font-black text-orange-600 text-sm">
                  ₱{((products.find((p) => p.id === Number(checkoutProductId))?.base_price || 0) * checkoutQuantity).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30"
                >
                  Place Order (POST /api/orders/checkout)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ANNOUNCEMENT MODAL (POST /api/announcements/admin/add) */}
      {isAddAnnouncementOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Post Announcement</h3>
              <button
                onClick={() => setIsAddAnnouncementOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={announcementFormData.title}
                  onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                  placeholder="e.g. Grand Weekend Promo!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  value={announcementFormData.content}
                  onChange={(e) => setAnnouncementFormData({ ...announcementFormData, content: e.target.value })}
                  placeholder="Write the announcement details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddAnnouncementOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30"
                >
                  Post Announcement (POST)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ANNOUNCEMENT MODAL (DELETE /api/announcements/admin/delete/{id}) */}
      {announcementToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              🗑️
            </div>
            <h3 className="text-base font-black text-stone-900 mb-1">Delete Announcement?</h3>
            <p className="text-xs text-stone-500 mb-4 font-medium">
              Are you sure you want to delete <strong>"{announcementToDelete.title}"</strong>?
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAnnouncementToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAnnouncement}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Delete (DELETE)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ORDER MODAL (DELETE /api/orders/admin/delete/{orderId}) */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              📦
            </div>
            <h3 className="text-base font-black text-stone-900 mb-1">Delete Order #{orderToDelete.id}?</h3>
            <p className="text-xs text-stone-500 mb-4 font-medium">
              Are you sure you want to permanently delete this {orderToDelete.status.toLowerCase()} order for <strong>{orderToDelete.customer_name}</strong>?
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL (DELETE /api/users/admin/delete/{id}) */}
      {userToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              👤
            </div>
            <h3 className="text-base font-black text-stone-900 mb-1">Delete User @{userToDelete.username}?</h3>
            <p className="text-xs text-stone-500 mb-4 font-medium">
              Are you sure you want to delete customer <strong>"{userToDelete.full_name || userToDelete.username}"</strong> from the database?
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ORDER MODAL */}
      {selectedProductForOrder && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <h3 className="text-base font-black text-stone-900">Add to Cart</h3>
              </div>
              <button
                onClick={() => setSelectedProductForOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* PRODUCT DETAILS SUMMARY */}
            {(() => {
              const storedVars = getStoredVariations(selectedProductForOrder.id);
              const hasVariations = storedVars.length > 0;
              const selectedVar = hasVariations
                ? storedVars.find((v: ProductVariation) => v.id === orderVariationId) || storedVars[0]
                : null;
              const itemPrice = selectedVar ? selectedVar.price : selectedProductForOrder.base_price;

              return (
                <>
                  <div className="flex items-center gap-4 bg-orange-50/60 border border-orange-100 p-3.5 rounded-2xl mb-4">
                    <img
                      src={getCategoryImageUrl(selectedProductForOrder)}
                      alt={selectedProductForOrder.name}
                      className="w-16 h-16 object-cover rounded-xl border border-orange-200 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-stone-900 text-sm line-clamp-1">
                        {selectedProductForOrder.name}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">Unit: {selectedProductForOrder.unit_type}</p>
                      <p className="text-sm font-black text-orange-600">₱{itemPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs font-medium">
                    {/* FLAVOR / VARIATION SELECTION (ONLY SHOWN IF PRODUCT HAS AVAILABLE VARIATIONS) */}
                    {hasVariations && (
                      <div className="space-y-1.5">
                        <label className="block text-stone-700 font-bold">Select Flavor / Variation:</label>
                        <select
                          value={orderVariationId ?? storedVars[0].id}
                          onChange={(e) => setOrderVariationId(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-orange-200 bg-white text-stone-900 font-bold focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer"
                        >
                          {storedVars.map((v: ProductVariation) => (
                            <option key={v.id} value={v.id}>
                              {v.flavor_name} — ₱{v.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* QUANTITY PICKER */}
                    <div className="space-y-1.5">
                      <label className="block text-stone-700 font-bold">Quantity:</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                          className="w-9 h-9 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-black text-sm flex items-center justify-center transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm font-black text-stone-900 font-mono">
                          {orderQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOrderQuantity((q) => q + 1)}
                          className="w-9 h-9 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-black text-sm flex items-center justify-center transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-stone-100">
              <button
                onClick={() => setSelectedProductForOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold cursor-pointer hover:bg-stone-50 transition text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlaceOrder}
                disabled={isSubmittingOrder}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md shadow-orange-600/30 cursor-pointer transition text-xs flex items-center justify-center gap-1.5"
              >
                {isSubmittingOrder ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Adding to Cart...</span>
                  </>
                ) : (
                  <>
                    <span>🛒</span>
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

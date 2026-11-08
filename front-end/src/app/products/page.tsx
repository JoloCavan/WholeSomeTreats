"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Product,
  ProductVariation,
  getCategoryImageUrl,
  defaultCheesecakeVariations,
  isSundayDate,
  getNextSundayLocalDateString,
  getUpcomingSundays,
  formatSundayDateDisplay,
  getEffectiveAvailableStock,
  Announcement,
} from "@/app/types";
import AuthModal from "@/app/components/AuthModal";
import AnnouncementModal from "@/app/components/AnnouncementModal";

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Chocolate Chip Cookies",
    base_price: 45.0,
    unit_type: "pc",
    image_url: "/images/chocolate_chip_cookie.jpg",
    is_available: true,
    max_order_limit: 30,
    available_stock: 30,
    delivery_date: "2026-11-08",
  },
  {
    id: 2,
    name: "Chewy Crinkles",
    base_price: 100.0,
    unit_type: "dozen",
    image_url: "/images/chewy_cringles.jpg",
    is_available: true,
    max_order_limit: 30,
    available_stock: 30,
    delivery_date: "2026-11-08",
  },
  {
    id: 3,
    name: "Chocolate Chip Nutty Banana Bread",
    base_price: 150.0,
    unit_type: "loaf",
    image_url: "/images/banana_bread.jpg",
    is_available: true,
    max_order_limit: 20,
    available_stock: 20,
    delivery_date: "2026-11-08",
  },
  {
    id: 4,
    name: "Burnt Basque Cheesecake",
    base_price: 180.0,
    unit_type: "piece",
    image_url: "/images/burnt_basque_cheesecake.jpg",
    is_available: true,
    max_order_limit: 15,
    available_stock: 15,
    delivery_date: "2026-11-08",
  },
  {
    id: 5,
    name: "NewYork Cheesecake",
    base_price: 220.0,
    unit_type: "piece",
    image_url: "/images/newyork_cheesecake.jpg",
    is_available: true,
    max_order_limit: 15,
    available_stock: 15,
    delivery_date: "2026-11-08",
  },
];

const loadStoredProducts = (customCart?: any[], customOrders?: any[]): Product[] => {
  let baseList = initialProducts;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("wt_products");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseList = parsed;
        }
      }
    } catch (e) {
      console.error("Load stored products error:", e);
    }
  }

  return baseList.map((p: Product) => {
    const maxLimit = p.max_order_limit != null ? Number(p.max_order_limit) : 30;
    const computedStock = getEffectiveAvailableStock(p, maxLimit, customCart, customOrders);
    return {
      ...p,
      max_order_limit: maxLimit,
      available_stock: computedStock,
      delivery_date: p.delivery_date || "2026-11-08",
      is_available: computedStock > 0 ? (p.is_available ?? true) : false,
      image_url: getCategoryImageUrl(p)
    };
  });
};

const saveStoredProducts = (items: Product[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("wt_products", JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("wt_products_updated", { detail: items }));
  } catch (e) {
    console.error("Save stored products error:", e);
  }
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

export default function ProductsPage() {
  const router = useRouter();

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        localStorage.removeItem("roleId");
      } catch (e) {}
    }
    const userStr = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        if (
          u.role === "Admin" ||
          u.role === "1" ||
          u.role === 1 ||
          u.username?.toLowerCase() === "wholesome"
        ) {
          setIsAdmin(true);
        }
      } catch (e) {}
    }
  }, []);

  // Selected Product for Variations Modal
  const [selectedProductForVariations, setSelectedProductForVariations] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);

  // Add / Edit Product Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    base_price: "",
    unit_type: "Piece",
    image_url: "",
    is_available: true,
    restock: "30",
    delivery_date: getNextSundayLocalDateString(),
  });

  // Dynamic Variations State in Modal
  const [hasVariations, setHasVariations] = useState(false);
  const [formVariations, setFormVariations] = useState<{ flavor_name: string; price: string }[]>([]);

  // Delete Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Quick Order Modal State
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderVariationId, setOrderVariationId] = useState<number | null>(null);
  const [orderAddress, setOrderAddress] = useState<string>("Olongapo City");
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<string>("COD");
  const [orderDeliveryDate, setOrderDeliveryDate] = useState<string>(
    getNextSundayLocalDateString()
  );
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // Auto-fetch announcements on site visit for pop-up
  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
          const storedUser = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
          let isUserAdmin = false;
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              isUserAdmin = parsed?.role?.toLowerCase() === "admin";
            } catch {}
          }
          if (!isUserAdmin) {
            setIsAnnouncementModalOpen(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Real-time synchronization across windows/tabs and sessions
  useEffect(() => {
    const syncProducts = () => {
      const stored = loadStoredProducts();
      setProducts(stored);
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "wt_products") {
        syncProducts();
      }
    };

    const handleCustomUpdate = () => {
      syncProducts();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("wt_products_updated", handleCustomUpdate);
    const interval = setInterval(syncProducts, 1500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("wt_products_updated", handleCustomUpdate);
      clearInterval(interval);
    };
  }, []);

  // Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. GET /api/products
  const fetchProducts = async () => {
    setLoading(true);
    const stored = loadStoredProducts();

    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mergedMap = new Map<number, Product>();
          stored.forEach((p) => mergedMap.set(p.id, p));
          data.forEach((p: Product) => {
            const existing = mergedMap.get(p.id);
            const limit = p.max_order_limit != null ? Number(p.max_order_limit) : (existing?.max_order_limit ?? 30);
            const currentAvail = existing?.available_stock ?? p.available_stock;
            const stock = getEffectiveAvailableStock(
              { ...p, available_stock: currentAvail, max_order_limit: limit },
              limit
            );
            mergedMap.set(p.id, {
              ...p,
              max_order_limit: limit,
              available_stock: stock,
              is_available: stock > 0 ? (p.is_available ?? true) : false,
            });
          });
          const mergedList = Array.from(mergedMap.values()).sort((a, b) => a.id - b.id);

          setProducts(mergedList);
          saveStoredProducts(mergedList);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log("GET /api/products network notice:", err);
    }

    setProducts(stored);
    saveStoredProducts(stored);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. GET /api/products/{id}/variations
  const handleOpenVariations = async (product: Product) => {
    setSelectedProductForVariations(product);
    setLoadingVariations(true);
    setVariations([]);

    const storedVars = getStoredVariations(product.id);
    if (storedVars.length > 0) {
      setVariations(storedVars);
    }

    try {
      const res = await fetch(`/api/products/${product.id}/variations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVariations(data);
          saveStoredVariations(product.id, data);
        } else if (storedVars.length === 0) {
          setVariations([]);
        }
      }
    } catch (err) {
      console.error("GET variations error:", err);
      if (storedVars.length === 0) setVariations([]);
    } finally {
      setLoadingVariations(false);
    }
  };

  const handleToggleProductAvailability = async (productId: number) => {
    const currentList = loadStoredProducts();
    let newStatus = false;
    let productName = "";
    const updated = currentList.map((p) => {
      if (p.id === productId) {
        newStatus = !p.is_available;
        productName = p.name;
        return { ...p, is_available: newStatus };
      }
      return p;
    });

    setProducts(updated);
    saveStoredProducts(updated);

    try {
      const res = await fetch(`/api/products/admin/${productId}/toggle-availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: typeof window !== "undefined" && sessionStorage.getItem("token") ? `Bearer ${sessionStorage.getItem("token")}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        newStatus = data.is_available;
      }
    } catch (e) {
      console.log("Toggle product error:", e);
    }

    showToast("success", `Product "${productName}" is now ${newStatus ? "Available (In Stock)" : "Unavailable"}.`);
  };

  const handleToggleVariationAvailability = async (productId: number, variationId: number) => {
    const currentVars = getStoredVariations(productId);
    let updatedFlavorName = "";
    let newStatus = true;
    const updated = currentVars.map((v) => {
      if (v.id === variationId) {
        newStatus = v.is_available === false ? true : false;
        updatedFlavorName = v.flavor_name;
        return { ...v, is_available: newStatus };
      }
      return v;
    });

    setVariations(updated);
    saveStoredVariations(productId, updated);

    try {
      const res = await fetch(`/api/products/admin/variations/${variationId}/toggle-availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: typeof window !== "undefined" && sessionStorage.getItem("token") ? `Bearer ${sessionStorage.getItem("token")}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        newStatus = data.is_available;
      }
    } catch (e) {
      console.log("Toggle variation error:", e);
    }

    showToast("success", `Flavor "${updatedFlavorName}" is now ${newStatus ? "Available (In Stock)" : "Unavailable"}.`);
  };

  const handleQuickRestock = async (productId: number, amount = 30) => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    const currentList = loadStoredProducts();
    const target = currentList.find((p) => p.id === productId);
    if (!target) return;

    const newStock = (target.available_stock ?? 0) + amount;
    const newLimit = Math.max(newStock, target.max_order_limit ?? 30);

    const updated = currentList.map((p) =>
      p.id === productId
        ? { ...p, available_stock: newStock, max_order_limit: newLimit, is_available: true }
        : p
    );

    setProducts(updated);
    saveStoredProducts(updated);

    try {
      await fetch(`/api/products/admin/update/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          id: target.id,
          name: target.name,
          base_price: target.base_price,
          unit_type: target.unit_type,
          image_url: target.image_url || null,
          is_available: true,
          max_order_limit: newLimit,
          available_stock: newStock,
        }),
      });
    } catch (e) {}

    showToast("success", `📦 Restocked +${amount} ${target.unit_type || "units"} for "${target.name}". Total available: ${newStock}.`);
  };

  // Open Add Product Form
  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      base_price: "",
      unit_type: "Piece",
      image_url: "",
      is_available: true,
      restock: "30",
      delivery_date: getNextSundayLocalDateString(),
    });
    setHasVariations(false);
    setFormVariations([{ flavor_name: "", price: "" }]);
    setIsFormOpen(true);
  };

  // Open Edit Product Form
  const handleOpenEditForm = (product: Product) => {
    setEditingProduct(product);
    const curStock = product.available_stock ?? product.max_order_limit ?? 30;
    setFormData({
      name: product.name,
      base_price: product.base_price.toString(),
      unit_type: product.unit_type || "Piece",
      image_url: product.image_url || "",
      is_available: product.is_available,
      restock: curStock <= 0 ? "30" : curStock.toString(),
      delivery_date: product.delivery_date || getNextSundayLocalDateString(),
    });

    const storedVars = getStoredVariations(product.id);
    if (storedVars.length > 0) {
      setHasVariations(true);
      setFormVariations(
        storedVars.map((v) => ({ flavor_name: v.flavor_name, price: v.price.toString() }))
      );
    } else {
      setHasVariations(false);
      setFormVariations([{ flavor_name: "", price: product.base_price.toString() }]);
    }

    setIsFormOpen(true);
  };

  const handleOpenOrderModal = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    const userStr = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    const isAuthenticated = Boolean(user && (user.username || user.id)) || Boolean(token && userStr);

    if (!isAuthenticated) {
      // Intercept click, prevent item from being added to cart, display login screen
      setShowLoginModal(true);
      return;
    }

    const curStock = product.available_stock ?? product.max_order_limit ?? 30;
    if (curStock <= 0) {
      showToast("error", `"${product.name}" is currently out of stock.`);
      return;
    }

    setSelectedProductForOrder(product);
    setOrderQuantity(1);
    setOrderAddress(localStorage.getItem("wt_user_address") || "Olongapo City");
    setOrderPaymentMethod("COD");
    setOrderDeliveryDate(getNextSundayLocalDateString());

    const storedVars = getStoredVariations(product.id);
    const availableVars = storedVars.filter((v: ProductVariation) => v.is_available !== false);
    if (storedVars.length > 0) {
      setOrderVariationId(availableVars.length > 0 ? availableVars[0].id : storedVars[0].id);
    } else {
      setOrderVariationId(null);
    }
  };

  const handleConfirmAddToCart = async () => {
    if (!selectedProductForOrder) return;

    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    const userStr = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    const isAuthenticated = Boolean(user && (user.username || user.id)) || Boolean(token && userStr);

    if (!isAuthenticated) {
      setSelectedProductForOrder(null);
      setShowLoginModal(true);
      return;
    }

    if (!selectedProductForOrder.is_available) {
      showToast("error", `"${selectedProductForOrder.name}" is currently unavailable and cannot be added to cart.`);
      return;
    }

    const maxLimit = selectedProductForOrder.max_order_limit ?? 30;
    const curStock = selectedProductForOrder.available_stock ?? maxLimit;
    if (curStock <= 0) {
      showToast("error", `"${selectedProductForOrder.name}" is out of stock.`);
      return;
    }
    if (orderQuantity > curStock) {
      showToast("error", `Cannot add to cart: Only ${curStock} ${selectedProductForOrder.unit_type || "pcs"} available.`);
      return;
    }

    setIsSubmittingOrder(true);

    let currentPrice = selectedProductForOrder.base_price;
    let selectedFlavorName: string | undefined = undefined;
    const storedVars = getStoredVariations(selectedProductForOrder.id);
    if (orderVariationId !== null && storedVars.length > 0) {
      const foundVar = storedVars.find((v) => v.id === orderVariationId);
      if (foundVar) {
        if (foundVar.is_available === false) {
          setIsSubmittingOrder(false);
          showToast("error", `The flavor "${foundVar.flavor_name}" is currently unavailable and cannot be added to cart.`);
          return;
        }
        currentPrice = foundVar.price;
        selectedFlavorName = foundVar.flavor_name;
      }
    }

    let currentUserId = 2;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.id) currentUserId = u.id;
      } catch (e) {}
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

    // Save to local cart storage wt_cart
    let storedCart = [];
    try {
      const raw = localStorage.getItem("wt_cart");
      if (raw) storedCart = JSON.parse(raw);
    } catch (e) {}

    const newCartItem = {
      id: Date.now(),
      user_id: currentUserId,
      product_id: selectedProductForOrder.id,
      variation_id: orderVariationId,
      quantity: orderQuantity,
      product_name: selectedProductForOrder.name,
      flavor_name: selectedFlavorName,
      unit_type: selectedProductForOrder.unit_type,
      image_url: selectedProductForOrder.image_url,
      price: currentPrice,
      delivery_date: selectedProductForOrder.delivery_date || getNextSundayLocalDateString(),
    };

    // Check if item exists in local cart, if so update quantity
    const existingIdx = storedCart.findIndex(
      (c: any) => c.product_id === newCartItem.product_id && c.variation_id === newCartItem.variation_id
    );
    if (existingIdx >= 0) {
      storedCart[existingIdx].quantity += orderQuantity;
    } else {
      storedCart.unshift(newCartItem);
    }

    try {
      localStorage.setItem("wt_cart", JSON.stringify(storedCart));
      localStorage.setItem("wt_active_tab", "cart");
      window.dispatchEvent(new CustomEvent("wt_cart_updated", { detail: storedCart }));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    const updatedProds = loadStoredProducts(storedCart);
    setProducts(updatedProds);
    saveStoredProducts(updatedProds);

    setIsSubmittingOrder(false);
    setSelectedProductForOrder(null);
    showToast("success", `🛒 "${selectedProductForOrder.name}" added to cart!`);
    router.push("/dashboard");
  };

  // 3. POST /api/products/admin/add & 4. PUT /api/products/admin/update/{id}
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

    const basePriceNum = parseFloat(formData.base_price) || 0;
    const restockQty = parseInt(formData.restock, 10);
    const newStock = isNaN(restockQty) ? 30 : Math.max(0, restockQty);
    const maxLimit = Math.max(newStock, editingProduct?.max_order_limit ?? 30);

    const payload = {
      name: formData.name,
      base_price: basePriceNum,
      unit_type: formData.unit_type,
      image_url: formData.image_url || null,
      is_available: newStock > 0 ? formData.is_available : false,
      max_order_limit: maxLimit,
      available_stock: newStock,
      delivery_date: formData.delivery_date || getNextSundayLocalDateString(),
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

    // Process Product Variations
    if (hasVariations) {
      const validVars: ProductVariation[] = formVariations
        .filter((v) => v.flavor_name.trim() !== "")
        .map((v, i) => ({
          id: Date.now() + i,
          product_id: targetId,
          flavor_name: v.flavor_name.trim(),
          price: parseFloat(v.price) || basePriceNum,
        }));

      saveStoredVariations(targetId, validVars);
    } else {
      saveStoredVariations(targetId, []);
    }

    showToast(
      "success",
      editingProduct
        ? `Product "${formData.name}" updated successfully!`
        : `Product "${formData.name}" added successfully (#${targetId})!`
    );
    setIsFormOpen(false);
  };

  // 5. DELETE /api/products/admin/delete/{id}
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

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
    saveStoredVariations(productToDelete.id, []);

    showToast("success", `Product "${productToDelete.name}" deleted.`);
    setProductToDelete(null);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-stone-900 font-sans selection:bg-orange-500 selection:text-white p-6">
      {/* Toast Notification */}
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

      {/* HEADER BAR */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-orange-200/80 rounded-3xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-1">
              <span>🍩</span> WholesomeTreats Bakery
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Products Catalog
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Explore our freshly baked treats, check pricing, and view flavor variations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
            >
              ← Back to Dashboard
            </button>
            {isAdmin && (
              <button
                onClick={handleOpenAddForm}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* CONTROLS & SEARCH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                onClick={handleOpenAddForm}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer mr-1"
              >
                <span>+ Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* PRODUCT LIST */}
        {loading ? (
          <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
            <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs font-bold text-stone-600">Loading products catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-orange-200 rounded-3xl">
            <p className="text-stone-500 text-sm font-bold">No products found matching "{search}"</p>
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
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold shadow ${
                        (p.available_stock ?? p.max_order_limit ?? 30) > 0 && p.is_available
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {(p.available_stock ?? p.max_order_limit ?? 30) > 0 && p.is_available
                        ? (p.available_stock != null ? `In Stock (${p.available_stock})` : "In Stock")
                        : "Out of Stock"}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-stone-900 text-base line-clamp-1">{p.name}</h3>
                      <span className="text-[11px] font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                        #{p.id}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-stone-500 font-medium">Unit: {p.unit_type}</span>
                      <span className="text-lg font-black text-orange-600">
                        ₱{p.base_price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-100">
                      <span className="text-stone-500 font-semibold">Stock:</span>
                      <span className={`font-bold ${(p.available_stock ?? 30) <= 0 ? "text-rose-600 font-black" : (p.available_stock ?? 30) <= 5 ? "text-amber-600" : "text-emerald-700"}`}>
                        {p.available_stock ?? 30} / {p.max_order_limit ?? 30} {p.unit_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500">
                      <span className="font-semibold">Delivery:</span>
                      <span className="font-bold text-orange-800 text-[10px] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">
                        🗓️ {p.delivery_date ? formatSundayDateDisplay(p.delivery_date) : "Sunday, Nov 8"}
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
                      onClick={(e) => handleOpenOrderModal(p, e)}
                      disabled={!p.is_available || (p.available_stock != null && p.available_stock <= 0)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        p.is_available && (p.available_stock == null || p.available_stock > 0)
                          ? "bg-orange-600 hover:bg-orange-500 text-white cursor-pointer shadow-md shadow-orange-600/20 active:scale-95"
                          : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                      }`}
                    >
                      {p.is_available && (p.available_stock == null || p.available_stock > 0) ? (
                        <>
                          <span>🛒</span>
                          <span>Add to Cart</span>
                        </>
                      ) : (
                        <>
                          <span>🚫</span>
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>
                  )}

                  {isAdmin && (
                    <div className="space-y-1.5">
                      {(p.available_stock ?? 0) <= 0 && (
                        <button
                          onClick={() => handleQuickRestock(p.id, 30)}
                          className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>📦 Quick Restock (+30)</span>
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditForm(p)}
                          className="flex-1 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition cursor-pointer"
                        >
                          ✏️ Edit / Restock
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="flex-1 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <button
                        onClick={() => handleToggleProductAvailability(p.id)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          p.is_available
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        <span>{p.is_available ? "⛔" : "✅"}</span>
                        <span>{p.is_available ? "Mark Unavailable" : "Mark Available"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
                {variations.map((v) => {
                  const isVarAvail = v.is_available !== false;
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/60 border border-orange-100 gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-stone-800">{v.flavor_name}</p>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            isVarAvail
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isVarAvail ? "In Stock" : "Unavailable"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-orange-600">
                          ₱{v.price.toFixed(2)}
                        </span>
                        {isAdmin && selectedProductForVariations && (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleVariationAvailability(
                                selectedProductForVariations.id,
                                v.id
                              )
                            }
                            className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer shrink-0 ${
                              isVarAvail
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isVarAvail ? "Mark Unavailable" : "Mark Available"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
      {isFormOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-stone-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. NewYork Cheesecake"
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
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="220.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">Unit Type *</label>
                  <select
                    value={formData.unit_type}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Piece">Piece</option>
                    <option value="pc">pc</option>
                    <option value="dozen">dozen</option>
                    <option value="loaf">loaf</option>
                    <option value="whole">whole</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-stone-700 font-bold">Restock *</label>
                  {editingProduct && (
                    <span className="text-[11px] text-stone-500 font-normal">
                      Current Available:{" "}
                      <strong className={(editingProduct.available_stock ?? 0) <= 0 ? "text-rose-600 font-bold" : "text-orange-600"}>
                        {editingProduct.available_stock ?? 0}
                      </strong>
                      {(editingProduct.available_stock ?? 0) <= 0 && (
                        <span className="ml-1 text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Finished
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.restock}
                  onChange={(e) => setFormData({ ...formData, restock: e.target.value })}
                  placeholder="e.g. 30"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
                />
                {/* Quick Restock Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-stone-500">Quick Restock:</span>
                  {[10, 20, 30, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setFormData({ ...formData, restock: qty.toString() })}
                      className="px-2 py-0.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 text-[10px] font-bold border border-orange-200 transition cursor-pointer"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-400 mt-1 font-normal">
                  Put new freshly baked units into stock. Once previous stock reaches 0, enter your restock amount here (e.g. 30) to make the item available for orders again.
                </p>
              </div>

              {/* Available Delivery Date (Per-Product Scheduling) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-stone-700 font-bold">Available Delivery Date *</label>
                  <span className="text-[10px] text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                    Per-Product Schedule
                  </span>
                </div>
                <select
                  value={formData.delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_date: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-bold text-xs cursor-pointer"
                >
                  {getUpcomingSundays(8).map((sun) => (
                    <option key={sun} value={sun}>
                      Sunday, {formatSundayDateDisplay(sun)} ({sun})
                    </option>
                  ))}
                </select>
                {/* Quick Sunday Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-stone-500 self-center">Quick Select:</span>
                  {getUpcomingSundays(4).map((sun) => (
                    <button
                      key={sun}
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_date: sun })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        formData.delivery_date === sun
                          ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                          : "bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200"
                      }`}
                    >
                      {formatSundayDateDisplay(sun)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-400 mt-1 font-normal">
                  Sets the scheduled delivery date for customers purchasing this specific item.
                </p>
              </div>

              <div>
                <label className="block text-stone-700 mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="e.g. /images/newyork_cheesecake.jpg or https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/40 border border-orange-200 text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAvailable"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="chkAvailable" className="text-stone-700 cursor-pointer">
                  Product is Available in Store
                </label>
              </div>

              {/* DYNAMIC VARIATIONS CHECKBOX & FIELDS */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="chkVariations" className="flex items-center gap-2 text-stone-800 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      id="chkVariations"
                      checked={hasVariations}
                      onChange={(e) => {
                        setHasVariations(e.target.checked);
                        if (e.target.checked && formVariations.length === 0) {
                          setFormVariations([{ flavor_name: "", price: formData.base_price || "0" }]);
                        }
                      }}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Add Product Variations / Flavors</span>
                  </label>
                </div>

                {hasVariations && (
                  <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-700 font-bold">
                      <span>Flavor Variations & Pricing</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormVariations([
                            ...formVariations,
                            { flavor_name: "", price: formData.base_price || "0" },
                          ])
                        }
                        className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Add Flavor</span>
                      </button>
                    </div>

                    {formVariations.map((varItem, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Flavor Name (e.g. Salted Caramel)"
                          value={varItem.flavor_name}
                          onChange={(e) => {
                            const updated = [...formVariations];
                            updated[idx].flavor_name = e.target.value;
                            setFormVariations(updated);
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
                              const updated = [...formVariations];
                              updated[idx].price = e.target.value;
                              setFormVariations(updated);
                            }}
                            className="w-full pl-7 pr-2 py-2 rounded-xl bg-white border border-orange-200 text-stone-900 font-medium"
                          />
                        </div>
                        {formVariations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormVariations(formVariations.filter((_, i) => i !== idx))}
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
                  onClick={() => setIsFormOpen(false)}
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

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              🗑️
            </div>
            <h3 className="text-base font-black text-stone-900 mb-1">Delete Product?</h3>
            <p className="text-xs text-stone-500 mb-4 font-medium">
              Are you sure you want to delete <strong>"{productToDelete.name}"</strong>?
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
                Delete Product
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
                    {hasVariations && (() => {
                      const availableVars = storedVars.filter((v: ProductVariation) => v.is_available !== false);
                      const allVariationsUnavailable = availableVars.length === 0;

                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-stone-700 font-bold">Select Flavor / Variation:</label>
                            {allVariationsUnavailable && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                All Flavors Unavailable
                              </span>
                            )}
                          </div>
                          <select
                            value={orderVariationId ?? (availableVars[0]?.id || storedVars[0]?.id)}
                            onChange={(e) => setOrderVariationId(Number(e.target.value))}
                            disabled={allVariationsUnavailable}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-orange-200 bg-white text-stone-900 font-bold focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer disabled:bg-stone-100 disabled:text-stone-400"
                          >
                            {storedVars.map((v: ProductVariation) => {
                              const isVarAvail = v.is_available !== false;
                              return (
                                <option key={v.id} value={v.id} disabled={!isVarAvail}>
                                  {v.flavor_name} — ₱{v.price.toFixed(2)} {!isVarAvail ? "(Unavailable)" : ""}
                                </option>
                              );
                            })}
                          </select>
                          {allVariationsUnavailable && (
                            <p className="text-[11px] text-rose-600 font-bold pt-1">
                              ⚠️ All flavor variations for this item are currently marked unavailable.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Pre-set Delivery Date for this item */}
                    <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                          Scheduled Delivery Date
                        </span>
                        <p className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                          <span>📅</span>
                          <span>
                            {selectedProductForOrder.delivery_date
                              ? `Sunday, ${formatSundayDateDisplay(selectedProductForOrder.delivery_date)} (${selectedProductForOrder.delivery_date})`
                              : "Sunday, Nov 8 (2026-11-08)"}
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200 shrink-0">
                        Pre-set by Bakery
                      </span>
                    </div>

                    {/* QUANTITY PICKER */}
                    {(() => {
                      const maxLimit = selectedProductForOrder.max_order_limit ?? 30;
                      const available = selectedProductForOrder.available_stock ?? maxLimit;
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-stone-700 font-bold">Quantity:</label>
                            <span className="text-[11px] text-stone-500 font-medium">
                              Available: <strong className="text-orange-600">{available}</strong> / {maxLimit} {selectedProductForOrder.unit_type || "pcs"}
                            </span>
                          </div>
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
                              onClick={() => setOrderQuantity((q) => Math.min(available, q + 1))}
                              disabled={orderQuantity >= available}
                              className="w-9 h-9 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-black text-sm flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                          {available <= 0 && (
                            <p className="text-[11px] text-rose-600 font-bold">This item is currently out of stock.</p>
                          )}
                        </div>
                      );
                    })()}
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
              {(() => {
                const storedVars = selectedProductForOrder ? getStoredVariations(selectedProductForOrder.id) : [];
                const hasVars = storedVars.length > 0;
                const hasAnyAvailableVar = !hasVars || storedVars.some((v: ProductVariation) => v.is_available !== false);
                const maxLimit = selectedProductForOrder?.max_order_limit ?? 30;
                const available = selectedProductForOrder?.available_stock ?? maxLimit;
                const isBlocked = !selectedProductForOrder?.is_available || !hasAnyAvailableVar || available <= 0;

                return (
                  <button
                    onClick={handleConfirmAddToCart}
                    disabled={isSubmittingOrder || isBlocked}
                    className={`flex-1 py-2.5 rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 ${
                      isBlocked
                        ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                        : "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30 cursor-pointer"
                    }`}
                  >
                    {isSubmittingOrder ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Adding to Cart...</span>
                      </>
                    ) : isBlocked ? (
                      <>
                        <span>🚫</span>
                        <span>{available <= 0 ? "Out of Stock" : "Unavailable"}</span>
                      </>
                    ) : (
                      <>
                        <span>🛒</span>
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Picture 2) */}
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setShowLoginModal(false);
          showToast("success", `Welcome back, ${loggedInUser.username || loggedInUser.full_name}!`);
        }}
        initialMessage="Please sign in to add items to your cart."
      />

      {/* Announcement Modal Pop-up Overlay */}
      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        announcements={announcements}
      />
    </div>
  );
}

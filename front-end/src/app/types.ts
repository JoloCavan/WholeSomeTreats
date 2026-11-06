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
  is_available?: boolean;
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
  payment_screenshot?: string;
  status: string;
  created_at: string;
  decline_reason?: string;
  contact_number?: string;
  zip_code?: string;
  landmark?: string;
  delivery_instructions?: string;
  lat?: number | null;
  lng?: number | null;
  location_confirmed?: boolean;
  items?: OrderItem[];
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface DailySale {
  salesDate: string;
  dailyRevenue: number;
  totalOrders: number;
}

export interface TopProduct {
  productName: string;
  totalUnitsSold: number;
  totalRevenueGenerated: number;
}

export interface FulfillmentRate {
  status: string;
  orderCount: number;
  percentage: number | string;
}

export interface PaymentMethodStat {
  paymentMethod: string;
  totalRevenue: number;
  numberOfTransactions: number;
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

export const defaultCheesecakeVariations: Record<number, ProductVariation[]> = {
  4: [
    { id: 1, product_id: 4, flavor_name: "Original", price: 180.0, is_available: true },
    { id: 2, product_id: 4, flavor_name: "Strawberry", price: 200.0, is_available: true },
    { id: 3, product_id: 4, flavor_name: "Blueberry", price: 200.0, is_available: true },
    { id: 4, product_id: 4, flavor_name: "Mango", price: 200.0, is_available: true },
  ],
  5: [
    { id: 5, product_id: 5, flavor_name: "Original", price: 220.0, is_available: true },
    { id: 6, product_id: 5, flavor_name: "Strawberry", price: 240.0, is_available: true },
    { id: 7, product_id: 5, flavor_name: "Blueberry", price: 240.0, is_available: true },
    { id: 8, product_id: 5, flavor_name: "Mango", price: 240.0, is_available: true },
  ],
};

export const getCategoryImageUrl = (p: { id?: number; name: string; image_url?: string | null }): string => {
  if (p.image_url && p.image_url.trim() !== "" && !p.image_url.includes("unsplash.com")) {
    return p.image_url;
  }
  const nameLower = (p.name || "").toLowerCase();
  if (nameLower.includes("cookie")) return "/images/chocolate_chip_cookie.jpg";
  if (nameLower.includes("cringle") || nameLower.includes("crinkle")) return "/images/chewy_cringles.jpg";
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

export const formatDeliveryDate = (dateStr?: string | null, createdAtStr?: string): string => {
  if (!dateStr || dateStr.trim() === "") {
    if (!createdAtStr) return "";
    const createdDate = new Date(createdAtStr);
    createdDate.setDate(createdDate.getDate() + 1);
    return `${createdDate.getMonth() + 1}/${createdDate.getDate()}/${createdDate.getFullYear()}`;
  }

  const str = dateStr.trim();

  if (str.includes("AM") || str.includes("PM") || str.includes("am") || str.includes("pm")) {
    return str;
  }

  if (str.includes(" ") || (str.includes("T") && str.includes(":"))) {
    const separator = str.includes(" ") ? " " : "T";
    const [dPart, tPart] = str.split(separator);
    let dateFormatted = dPart;
    if (dPart.includes("-")) {
      const parts = dPart.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (!isNaN(month) && !isNaN(day) && year.length === 4) {
          dateFormatted = `${month}/${day}/${year}`;
        }
      }
    }

    if (tPart && tPart.includes(":")) {
      const [hStr, mStr] = tPart.split(":");
      const h = parseInt(hStr, 10);
      if (!isNaN(h)) {
        const period = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        const mClean = (mStr || "00").split(".")[0].slice(0, 2);
        return `${dateFormatted} at ${h12}:${mClean} ${period}`;
      }
    }
    return `${dateFormatted} ${tPart}`;
  }

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
  } catch (e) { }

  return str;
};

export const getNextSundayLocalDateString = (fromDate: Date = new Date()): string => {
  const d = new Date(fromDate);
  const dayOfWeek = d.getDay();
  let daysUntilSunday = (7 - dayOfWeek) % 7;
  if (daysUntilSunday === 0) daysUntilSunday = 7;
  d.setDate(d.getDate() + daysUntilSunday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isSundayDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const clean = dateStr.trim().split(" ")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return false;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.getDay() === 0;
};

export const getUpcomingSundays = (count: number = 4): string[] => {
  const list: string[] = [];
  const base = new Date();
  const dayOfWeek = base.getDay();
  let daysUntilNextSunday = (7 - dayOfWeek) % 7;
  if (daysUntilNextSunday === 0) daysUntilNextSunday = 7;

  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + daysUntilNextSunday + i * 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    list.push(`${year}-${month}-${day}`);
  }
  return list;
};

export const formatSundayDateDisplay = (dateStr: string): string => {
  try {
    const clean = dateStr.trim().split(" ")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
  } catch (e) { }
  return dateStr;
};

export const formatPreferredTimeDisplay = (timeStr?: string): string => {
  if (!timeStr) return "10:00 AM";
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) return clean.toUpperCase();
  const parts = clean.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parts[1].slice(0, 2) : "00";
  if (isNaN(hours)) return clean;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes.padStart(2, "0")} ${ampm}`;
};

export const getOrderGrandTotal = (ord: Order): number => {
  const itemsSubtotal =
    ord.items && ord.items.length > 0
      ? ord.items.reduce(
        (sum: number, it: OrderItem) =>
          sum + Number(it.price_at_purchase || 0) * Number(it.quantity || 1),
        0
      )
      : Number(ord.total_amount || 0);

  if (Number(ord.total_amount || 0) >= itemsSubtotal + 50) {
    return Number(ord.total_amount);
  }
  return itemsSubtotal + 50;
};

export const getTomorrowLocalDateString = (): string => {
  return getNextSundayLocalDateString();
};


using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace API.OrdersModule
{
    public class Order
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("user_id")]
        public int UserId { get; set; }

        [JsonPropertyName("total_amount")]
        public decimal TotalAmount { get; set; }

        [JsonPropertyName("payment_method")]
        public string PaymentMethod { get; set; } = string.Empty;

        [JsonPropertyName("gcash_reference_no")]
        public string? GcashReferenceNo { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Pending";

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("customer_name")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("customer_address")]
        public string CustomerAddress { get; set; } = string.Empty;

        [JsonPropertyName("delivery_date")]
        public string DeliveryDate { get; set; } = string.Empty;

        [JsonPropertyName("decline_reason")]
        public string? DeclineReason { get; set; }

        // Delivery location fields
        [JsonPropertyName("contact_number")]
        public string ContactNumber { get; set; } = string.Empty;

        [JsonPropertyName("zip_code")]
        public string ZipCode { get; set; } = string.Empty;

        [JsonPropertyName("landmark")]
        public string Landmark { get; set; } = string.Empty;

        [JsonPropertyName("delivery_instructions")]
        public string DeliveryInstructions { get; set; } = string.Empty;

        [JsonPropertyName("lat")]
        public double? Lat { get; set; }

        [JsonPropertyName("lng")]
        public double? Lng { get; set; }

        [JsonPropertyName("location_confirmed")]
        public bool LocationConfirmed { get; set; }

        [JsonPropertyName("items")]
        public List<OrderItemDetail> Items { get; set; } = new List<OrderItemDetail>();
    }

    public class OrderItemDetail
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("order_id")]
        public int OrderId { get; set; }

        [JsonPropertyName("product_id")]
        public int ProductId { get; set; }

        [JsonPropertyName("product_name")]
        public string ProductName { get; set; } = string.Empty;

        [JsonPropertyName("flavor_name")]
        public string? FlavorName { get; set; }

        [JsonPropertyName("unit_type")]
        public string UnitType { get; set; } = "pc";

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }

        [JsonPropertyName("price_at_purchase")]
        public decimal PriceAtPurchase { get; set; }
    }

    public class CreateOrderRequest
    {
        [JsonPropertyName("cart_items")]
        public List<CartItemSummary> CartItems { get; set; } = new();

        [JsonPropertyName("payment_method")]
        public string PaymentMethod { get; set; } = "COD";

        [JsonPropertyName("customer_address")]
        public string CustomerAddress { get; set; } = string.Empty;

        [JsonPropertyName("delivery_date")]
        public string DeliveryDate { get; set; } = string.Empty;

        [JsonPropertyName("contact_number")]
        public string ContactNumber { get; set; } = string.Empty;

        [JsonPropertyName("zip_code")]
        public string ZipCode { get; set; } = string.Empty;

        [JsonPropertyName("landmark")]
        public string Landmark { get; set; } = string.Empty;

        [JsonPropertyName("delivery_instructions")]
        public string DeliveryInstructions { get; set; } = string.Empty;

        [JsonPropertyName("lat")]
        public double? Lat { get; set; }

        [JsonPropertyName("lng")]
        public double? Lng { get; set; }

        [JsonPropertyName("location_confirmed")]
        public bool LocationConfirmed { get; set; }
    }
}
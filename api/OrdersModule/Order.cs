using System;
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
    }
}
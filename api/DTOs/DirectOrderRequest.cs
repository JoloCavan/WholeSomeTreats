using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class DirectOrderRequest
    {
        [Required]
        public int ProductId { get; set; }

        public int? VariationId { get; set; }

        public int Quantity { get; set; } = 1;

        public decimal Price { get; set; }

        public string PaymentMethod { get; set; } = "COD";

        public string CustomerAddress { get; set; } = string.Empty;

        public string DeliveryDate { get; set; } = string.Empty;

        public int? UserId { get; set; }
    }
}

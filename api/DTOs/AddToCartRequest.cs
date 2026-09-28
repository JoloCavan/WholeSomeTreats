using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class AddToCartRequest
    {
        [Required]
        public int ProductId { get; set; }
        
        public int? VariationId { get; set; }

        [Required]
        [Range(1, 100)]
        public int Quantity { get; set; } = 1;
    }
}
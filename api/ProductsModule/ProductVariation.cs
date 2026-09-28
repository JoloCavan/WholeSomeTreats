using System.Text.Json.Serialization;

namespace API.ProductsModule
{
    public class ProductVariation
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("product_id")]
        public int ProductId { get; set; }

        [JsonPropertyName("flavor_name")]
        public string FlavorName { get; set; } = string.Empty;

        [JsonPropertyName("price")]
        public decimal Price { get; set; }
    }
}
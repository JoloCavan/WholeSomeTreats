using System.Text.Json.Serialization;

namespace API.ProductsModule
{
    public class Product
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("base_price")]
        public decimal BasePrice { get; set; }

        [JsonPropertyName("unit_type")]
        public string UnitType { get; set; } = string.Empty;

        [JsonPropertyName("image_url")]
        public string? ImageUrl { get; set; }

        [JsonPropertyName("is_available")]
        public bool IsAvailable { get; set; }
    }
}
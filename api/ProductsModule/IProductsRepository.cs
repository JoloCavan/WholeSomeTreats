using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.ProductsModule
{
    public interface IProductsRepository
    {
        Task<IEnumerable<Product>> GetAllAsync();
        Task<Product?> GetByIdAsync(int id);
        Task<IEnumerable<ProductVariation>> GetVariationsAsync(int productId);
        Task<ProductVariation?> GetVariationByIdAsync(int variationId);
        Task<int> AddProductAsync(Product product);
        Task UpdateProductAsync(Product product);
        Task DeleteProductAsync(int productId);
        Task<bool> ToggleProductAvailabilityAsync(int productId);
        Task<bool> ToggleVariationAvailabilityAsync(int variationId);
    }
}
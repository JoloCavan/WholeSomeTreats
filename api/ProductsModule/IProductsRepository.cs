using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.ProductsModule
{
    public interface IProductsRepository
    {
        Task<IEnumerable<Product>> GetAllAsync();
        Task<IEnumerable<ProductVariation>> GetVariationsAsync(int productId);
        Task<int> AddProductAsync(Product product);
        Task UpdateProductAsync(Product product);
        Task DeleteProductAsync(int productId);
    }
}
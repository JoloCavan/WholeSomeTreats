using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using API.ProductsModule;

namespace API.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/products")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductsRepository _productsRepository;

        public ProductsController(IProductsRepository productsRepository)
        {
            _productsRepository = productsRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetAll()
        {
            var products = await _productsRepository.GetAllAsync();
            return Ok(products);
        }

        [HttpGet("{id}/variations")]
        public async Task<ActionResult<IEnumerable<ProductVariation>>> GetVariations(int id)
        {
            var variations = await _productsRepository.GetVariationsAsync(id);
            return Ok(variations);
        }

        [HttpPost("admin/add")]
        public async Task<IActionResult> AddProduct([FromBody] Product product)
        {
            if (string.IsNullOrWhiteSpace(product.Name))
            {
                return BadRequest(new { message = "Product name is required." });
            }

            int newId = await _productsRepository.AddProductAsync(product);
            return Ok(new { message = "Product added successfully.", id = newId });
        }

        [HttpPut("admin/update/{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product product)
        {
            product.Id = id;
            await _productsRepository.UpdateProductAsync(product);
            return Ok(new { message = "Product updated successfully." });
        }

        [HttpDelete("admin/delete/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            await _productsRepository.DeleteProductAsync(id);
            return Ok(new { message = "Product deleted successfully." });
        }

        [HttpPut("admin/{id}/toggle-availability")]
        public async Task<IActionResult> ToggleProductAvailability(int id)
        {
            bool isAvailable = await _productsRepository.ToggleProductAvailabilityAsync(id);
            return Ok(new { message = $"Product availability updated to {(isAvailable ? "In Stock" : "Unavailable")}.", is_available = isAvailable });
        }

        [HttpPut("admin/variations/{variationId}/toggle-availability")]
        public async Task<IActionResult> ToggleVariationAvailability(int variationId)
        {
            bool isAvailable = await _productsRepository.ToggleVariationAvailabilityAsync(variationId);
            return Ok(new { message = $"Variation availability updated to {(isAvailable ? "In Stock" : "Unavailable")}.", is_available = isAvailable });
        }
    }
}
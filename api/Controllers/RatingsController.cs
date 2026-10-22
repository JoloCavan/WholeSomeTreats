using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using API.RatingsModule;

namespace API.Controllers
{
    [ApiController]
    [Route("api/ratings")]
    public class RatingsController : ControllerBase
    {
        private readonly IRatingRepository _ratingRepository;

        public RatingsController(IRatingRepository ratingRepository)
        {
            _ratingRepository = ratingRepository;
        }

        // GET /api/ratings/product/{productId}
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductRatings(int productId)
        {
            var ratings = await _ratingRepository.GetRatingsByProductAsync(productId);
            return Ok(ratings);
        }

        // GET /api/ratings/user/{userId}/product/{productId}
        [HttpGet("user/{userId}/product/{productId}")]
        public async Task<IActionResult> GetUserRating(int userId, int productId)
        {
            var rating = await _ratingRepository.GetUserRatingForProductAsync(userId, productId);
            if (rating == null) return NotFound();
            return Ok(rating);
        }

        // POST /api/ratings
        [HttpPost]
        public async Task<IActionResult> SubmitRating([FromBody] SubmitRatingRequest request)
        {
            if (request == null || request.UserId <= 0 || request.ProductId <= 0
                || request.Stars < 1 || request.Stars > 5)
                return BadRequest(new { message = "Invalid rating data." });

            await _ratingRepository.UpsertRatingAsync(
                request.UserId,
                request.Username ?? "Customer",
                request.ProductId,
                request.Stars,
                request.Comment ?? ""
            );
            return Ok(new { message = "Rating saved." });
        }
    }

    public class SubmitRatingRequest
    {
        public int UserId { get; set; }
        public string? Username { get; set; }
        public int ProductId { get; set; }
        public int Stars { get; set; }
        public string? Comment { get; set; }
    }
}

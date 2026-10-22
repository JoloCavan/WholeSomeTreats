using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.RatingsModule
{
    public interface IRatingRepository
    {
        Task<IEnumerable<Rating>> GetRatingsByProductAsync(int productId);
        Task<Rating?> GetUserRatingForProductAsync(int userId, int productId);
        Task UpsertRatingAsync(int userId, string username, int productId, int stars, string comment);
    }
}

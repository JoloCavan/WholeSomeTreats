using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Threading.Tasks;
using API.Main;

namespace API.RatingsModule
{
    public class RatingRepository : BaseRepository, IRatingRepository
    {
        public RatingRepository(MyCon dbConnection) : base(dbConnection) { }

        private DbParameter P(string name, object value)
        {
            var p = CreateParameter(name, value);
            return p;
        }

        public async Task<IEnumerable<Rating>> GetRatingsByProductAsync(int productId)
        {
            var sql = @"
                SELECT r.id, r.user_id, u.username, r.product_id, r.stars, r.comment, r.created_at
                FROM ratings r
                JOIN users u ON r.user_id = u.id
                WHERE r.product_id = @productId
                ORDER BY r.created_at DESC;";

            return await ExecuteReaderToListAsync(sql, reader => new Rating
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                UserId = reader.GetInt32(reader.GetOrdinal("user_id")),
                Username = reader.GetString(reader.GetOrdinal("username")),
                ProductId = reader.GetInt32(reader.GetOrdinal("product_id")),
                Stars = reader.GetInt32(reader.GetOrdinal("stars")),
                Comment = reader["comment"] != DBNull.Value ? reader.GetString(reader.GetOrdinal("comment")) : "",
                CreatedAt = reader["created_at"] != DBNull.Value ? reader.GetDateTime(reader.GetOrdinal("created_at")).ToString("o") : ""
            }, new[] { P("productId", productId) });
        }

        public async Task<Rating?> GetUserRatingForProductAsync(int userId, int productId)
        {
            var sql = @"
                SELECT r.id, r.user_id, u.username, r.product_id, r.stars, r.comment, r.created_at
                FROM ratings r
                JOIN users u ON r.user_id = u.id
                WHERE r.user_id = @userId AND r.product_id = @productId
                LIMIT 1;";

            var results = await ExecuteReaderToListAsync(sql, reader => new Rating
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                UserId = reader.GetInt32(reader.GetOrdinal("user_id")),
                Username = reader.GetString(reader.GetOrdinal("username")),
                ProductId = reader.GetInt32(reader.GetOrdinal("product_id")),
                Stars = reader.GetInt32(reader.GetOrdinal("stars")),
                Comment = reader["comment"] != DBNull.Value ? reader.GetString(reader.GetOrdinal("comment")) : "",
                CreatedAt = reader["created_at"] != DBNull.Value ? reader.GetDateTime(reader.GetOrdinal("created_at")).ToString("o") : ""
            }, new[] { P("userId", userId), P("productId", productId) });

            foreach (var r in results) return r;
            return null;
        }

        public async Task UpsertRatingAsync(int userId, string username, int productId, int stars, string comment)
        {
            var sql = @"
                INSERT INTO ratings (user_id, product_id, stars, comment)
                VALUES (@userId, @productId, @stars, @comment)
                ON CONFLICT (user_id, product_id)
                DO UPDATE SET stars = @stars, comment = @comment, created_at = CURRENT_TIMESTAMP;";

            await ExecuteNonQueryAsync(sql, new DbParameter[]
            {
                P("userId", userId),
                P("productId", productId),
                P("stars", stars),
                P("comment", comment)
            });
        }
    }
}

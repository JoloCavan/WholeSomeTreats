using System;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using API.Main;

namespace API.UsersModule
{
    public class UserRepository : BaseRepository, IUserRepository
    {
        public UserRepository(MyCon dbConnection) : base(dbConnection) { }

        private string GetStringOrEmpty(DbDataReader reader, string columnName)
        {
            int ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? "" : reader.GetString(ordinal);
        }

        private User MapReaderToUser(DbDataReader reader)
        {
            return new User
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Username = GetStringOrEmpty(reader, "username"),
                FullName = GetStringOrEmpty(reader, "full_name"),
                PhoneNumber = GetStringOrEmpty(reader, "phone_number"),
                Address = GetStringOrEmpty(reader, "address"),
                PasswordHash = GetStringOrEmpty(reader, "password_hash"),
                Role = GetStringOrEmpty(reader, "role")
            };
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await ExecuteReaderToListAsync("SELECT * FROM users ORDER BY id DESC", MapReaderToUser);
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            var results = await ExecuteReaderToListAsync(
                "SELECT * FROM users WHERE username = @username",
                MapReaderToUser,
                new[] { CreateParameter("username", username) });
            return results.FirstOrDefault();
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            var results = await ExecuteReaderToListAsync(
                "SELECT * FROM users WHERE id = @id",
                MapReaderToUser,
                new[] { CreateParameter("id", id) });
            return results.FirstOrDefault();
        }

        public async Task AddAsync(User entity)
        {
            var sql = "INSERT INTO users (username, full_name, phone_number, address, password_hash, role) VALUES (@username, @name, @phone, @address, @hash, @role)";
            await ExecuteNonQueryAsync(sql, new[]
            {
                CreateParameter("username", entity.Username),
                CreateParameter("name", entity.FullName),
                CreateParameter("phone", entity.PhoneNumber),
                CreateParameter("address", entity.Address),
                CreateParameter("hash", entity.PasswordHash),
                CreateParameter("role", entity.Role)
            });
        }

        public async Task UpdatePasswordAsync(int userId, string newPasswordHash)
        {
            var sql = "UPDATE users SET password_hash = @hash WHERE id = @id";
            await ExecuteNonQueryAsync(sql, new[]
            {
                CreateParameter("hash", newPasswordHash),
                CreateParameter("id", userId)
            });
        }

        public async Task UpdateRoleAsync(int userId, string newRole)
        {
            var sql = "UPDATE users SET role = @role WHERE id = @id";
            await ExecuteNonQueryAsync(sql, new[]
            {
                CreateParameter("role", newRole),
                CreateParameter("id", userId)
            });
        }

        public async Task DeleteUserAsync(int userId)
        {
            var sql = "DELETE FROM users WHERE id = @id";
            await ExecuteNonQueryAsync(sql, new[] { CreateParameter("id", userId) });
        }
    }
}
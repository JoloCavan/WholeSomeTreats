using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using API.Main;

namespace API.UsersModule
{
    public class UserRepository : BaseRepository, IUserRepository
    {
        public UserRepository(MyCon dbConnection) : base(dbConnection) { }

        private static string GetStringOrEmpty(DbDataReader reader, string columnName)
        {
            try
            {
                int ordinal = reader.GetOrdinal(columnName);
                if (reader.IsDBNull(ordinal)) return string.Empty;
                return reader.GetString(ordinal);
            }
            catch
            {
                return string.Empty;
            }
        }

        private static User MapReaderToUser(DbDataReader reader)
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

        public async Task<int> CreateUserAsync(User user)
        {
            var sql = "INSERT INTO users (username, full_name, phone_number, address, password_hash, role) VALUES (@username, @fullName, @phoneNumber, @address, @passwordHash, @role) RETURNING id";
            var parameters = new[]
            {
                CreateParameter("username", user.Username),
                CreateParameter("fullName", user.FullName ?? string.Empty),
                CreateParameter("phoneNumber", user.PhoneNumber ?? string.Empty),
                CreateParameter("address", user.Address ?? string.Empty),
                CreateParameter("passwordHash", user.PasswordHash),
                CreateParameter("role", string.IsNullOrWhiteSpace(user.Role) ? "customer" : user.Role)
            };
            
            var result = await ExecuteScalarAsync(sql, parameters);
            return Convert.ToInt32(result);
        }

        public async Task<User> GetUserByUsernameAsync(string username)
        {
            var sql = "SELECT * FROM users WHERE LOWER(username) = LOWER(@username)";
            var users = await ExecuteReaderToListAsync(sql, MapReaderToUser, new[] { CreateParameter("username", username) });
            return users.FirstOrDefault()!;
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            var sql = "SELECT * FROM users WHERE id = @id";
            var users = await ExecuteReaderToListAsync(sql, MapReaderToUser, new[] { CreateParameter("id", id) });
            return users.FirstOrDefault()!;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            var sql = "SELECT * FROM users ORDER BY id ASC";
            return await ExecuteReaderToListAsync(sql, MapReaderToUser);
        }

        public async Task<bool> UpdateRoleAsync(int id, string role)
        {
            var sql = "UPDATE users SET role = @role WHERE id = @id";
            int rows = await ExecuteNonQueryAsync(sql, new[] {
                CreateParameter("role", role),
                CreateParameter("id", id)
            });
            return rows > 0;
        }

        public async Task<bool> UpdatePasswordAsync(int id, string newPasswordHash)
        {
            var sql = "UPDATE users SET password_hash = @passwordHash WHERE id = @id";
            int rows = await ExecuteNonQueryAsync(sql, new[] { 
                CreateParameter("passwordHash", newPasswordHash),
                CreateParameter("id", id)
            });
            return rows > 0;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var sql = "DELETE FROM users WHERE id = @id";
            int rows = await ExecuteNonQueryAsync(sql, new[] { CreateParameter("id", id) });
            return rows > 0;
        }
    }
}
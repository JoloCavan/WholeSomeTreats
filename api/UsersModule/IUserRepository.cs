using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.UsersModule
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByIdAsync(int id);
        Task AddAsync(User entity);
        Task UpdatePasswordAsync(int userId, string newPasswordHash);
        Task UpdateRoleAsync(int userId, string newRole);
        Task DeleteUserAsync(int userId);
    }
}
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.UsersModule
{
    public interface IUserRepository
    {
        Task<int> CreateUserAsync(User user);
        Task<User> GetUserByUsernameAsync(string username);
        Task<User> GetUserByIdAsync(int id);
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<bool> UpdateRoleAsync(int id, string role);
        Task<bool> UpdatePasswordAsync(int id, string newPasswordHash);
        Task<bool> DeleteUserAsync(int id);
    }
}
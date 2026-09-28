using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using API.UsersModule;

namespace API.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAll()
        {
            var users = await _userRepository.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpDelete("admin/delete/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            await _userRepository.DeleteUserAsync(id);
            return Ok(new { message = "User deleted successfully." });
        }

        public class UpdateRoleDto
        {
            public string Role { get; set; } = string.Empty;
        }

        [HttpPut("admin/role/{id}")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Role))
                return BadRequest(new { message = "Role cannot be empty." });

            await _userRepository.UpdateRoleAsync(id, dto.Role);
            return Ok(new { message = $"User role updated to '{dto.Role}'." });
        }
    }
}

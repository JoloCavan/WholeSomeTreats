using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using API.UsersModule;

namespace API.Controllers
{
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
        [AllowAnonymous]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsersAsync();
            return Ok(users);
        }

        public class UpdateRoleDto
        {
            public string Role { get; set; } = "customer";
        }

        [HttpPut("admin/role/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleDto dto)
        {
            var success = await _userRepository.UpdateRoleAsync(id, dto?.Role ?? "customer");
            if (!success) return NotFound(new { message = "User not found." });
            
            return Ok(new { message = "Role updated successfully." });
        }
    }
}
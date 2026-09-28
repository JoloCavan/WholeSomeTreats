using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;
using API.DTOs;
using API.UsersModule;
using API.Security;

namespace API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthController(IUserRepository userRepository, IJwtTokenService jwtTokenService)
        {
            _userRepository = userRepository;
            _jwtTokenService = jwtTokenService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
        {
            var existingUser = await _userRepository.GetByUsernameAsync(dto.Username);
            if (existingUser != null)
                return Conflict(new { message = "Username is already taken." });

            var user = new User
            {
                Username = dto.Username,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address,
                PasswordHash = PasswordHasher.Hash(dto.Password),
                Role = "customer"
            };

            await _userRepository.AddAsync(user);
            return Ok(new { message = "User registered successfully." });
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Username and password are required." });

            var user = await _userRepository.GetByUsernameAsync(dto.Username);
            if (user == null)
                return Unauthorized(new { message = "Invalid username or password." });

            bool isValidPassword = false;
            try
            {
                isValidPassword = PasswordHasher.Verify(user.PasswordHash, dto.Password);
            }
            catch
            {
                isValidPassword = false;
            }

            if (!isValidPassword && user.PasswordHash == dto.Password)
            {
                isValidPassword = true;
            }

            if (!isValidPassword)
                return Unauthorized(new { message = "Invalid username or password." });

            string token = _jwtTokenService.GenerateToken(user);
            return Ok(new { 
                message = "Login successful.", 
                token = token, 
                user = new { 
                    id = user.Id, 
                    username = user.Username, 
                    fullName = user.FullName ?? user.Username, 
                    role = user.Role ?? "customer"
                } 
            });
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest dto)
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null || !PasswordHasher.Verify(user.PasswordHash, dto.OldPassword))
                return BadRequest(new { message = "Invalid current password." });

            await _userRepository.UpdatePasswordAsync(userId, PasswordHasher.Hash(dto.NewPassword));
            return Ok(new { message = "Password updated successfully." });
        }

        [HttpDelete("delete-account")]
        [Authorize]
        public async Task<IActionResult> DeleteAccount()
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            await _userRepository.DeleteUserAsync(userId);
            return Ok(new { message = "Account deleted successfully." });
        }
    }
}
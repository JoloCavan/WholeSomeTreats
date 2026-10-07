using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using API.UsersModule;
using API.DTOs;
using API.Security;

namespace API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtTokenService _jwtService;

        public AuthController(IUserRepository userRepository, JwtTokenService jwtService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized(new { message = "Invalid token." });

            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            return Ok(new 
            { 
                id = user.Id, 
                username = user.Username, 
                roleId = user.RoleId 
            });
        }

        private static bool IsStrongPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8) return false;
            bool hasUpper = password.Any(char.IsUpper);
            bool hasLower = password.Any(char.IsLower);
            bool hasDigit = password.Any(char.IsDigit);
            bool hasSpecial = password.Any(ch => !char.IsLetterOrDigit(ch));
            return hasUpper && hasLower && hasDigit && hasSpecial;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Username))
                {
                    return BadRequest(new { message = "Username is required." });
                }

                string username = request.Username.Trim();

                string phone = request.PhoneNumber?.Trim() ?? string.Empty;
                if (!System.Text.RegularExpressions.Regex.IsMatch(phone, @"^09\d{9}$") ||
                    phone == "09000000000" || phone == "09111111111" || phone == "09999999999" || phone == "09123456789")
                {
                    return BadRequest(new { message = "Please enter a valid 11-digit Philippine mobile number starting with 09 (e.g. 09171234567)." });
                }

                if (string.IsNullOrWhiteSpace(request.Password) || !IsStrongPassword(request.Password))
                {
                    return BadRequest(new { message = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." });
                }

                var existingUser = await _userRepository.GetUserByUsernameAsync(username);
                if (existingUser != null) return BadRequest(new { message = "This username already exists." });

                var newUser = new User
                {
                    Username = username,
                    FullName = string.IsNullOrWhiteSpace(request.FullName) ? username : request.FullName.Trim(),
                    PhoneNumber = request.PhoneNumber?.Trim() ?? string.Empty,
                    Address = request.Address?.Trim() ?? string.Empty,
                    PasswordHash = PasswordHasher.HashPassword(request.Password),
                    Role = "customer"
                };

                await _userRepository.CreateUserAsync(newUser);
                return Ok(new { message = "User registered successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [Register Error]: {ex.Message} \n{ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred during registration. Please try again.", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new { message = "Username and password are required." });
                }

                string username = request.Username.Trim();
                var user = await _userRepository.GetUserByUsernameAsync(username);
                
                if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
                    return Unauthorized(new { message = "Invalid username or password." });

                var token = _jwtService.GenerateToken(user);
                
                return Ok(new { 
                    token = token, 
                    roleId = user.RoleId,
                    role = user.Role,
                    user = new {
                        id = user.Id,
                        username = user.Username,
                        full_name = user.FullName,
                        phone_number = user.PhoneNumber,
                        address = user.Address,
                        role = user.Role,
                        roleId = user.RoleId
                    },
                    message = "Login successful."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [Login Error]: {ex.Message} \n{ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred during login. Please try again.", error = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Username))
                {
                    return BadRequest(new { message = "Username is required." });
                }

                string username = request.Username.Trim();
                var user = await _userRepository.GetUserByUsernameAsync(username);
                if (user == null)
                {
                    return NotFound(new { message = "User with specified username not found." });
                }

                if (string.IsNullOrWhiteSpace(request.NewPassword) || !IsStrongPassword(request.NewPassword))
                {
                    return BadRequest(new { message = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." });
                }

                string newHash = PasswordHasher.HashPassword(request.NewPassword);
                await _userRepository.UpdatePasswordAsync(user.Id, newHash);

                return Ok(new { message = "Password reset successfully. You can now log in with your new password." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [ForgotPassword Error]: {ex.Message} \n{ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while resetting password.", error = ex.Message });
            }
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            string newHash = PasswordHasher.HashPassword(request.NewPassword);
            await _userRepository.UpdatePasswordAsync(userId, newHash);
            
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
using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class RegisterRequest
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(@"^09\d{9}$", ErrorMessage = "Please enter a valid Philippine mobile number starting with 09 (e.g. 09171234567).")]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }
}
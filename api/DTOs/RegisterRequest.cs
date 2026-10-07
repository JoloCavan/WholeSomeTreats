using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class RegisterRequest
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Phone number must contain exactly 11 digits.")]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }
}
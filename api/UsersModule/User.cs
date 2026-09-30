using System.Text.Json.Serialization;

namespace API.UsersModule
{
    public class User
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [JsonPropertyName("full_name")]
        public string FullName { get; set; } = string.Empty;

        [JsonPropertyName("phone_number")]
        public string PhoneNumber { get; set; } = string.Empty;

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;

        [JsonPropertyName("role")]
        public string Role { get; set; } = "customer";

        [JsonIgnore]
        public int RoleId
        {
            get => Role?.ToLower() == "admin" ? 1 : 2;
            set => Role = value == 1 ? "Admin" : "customer";
        }
    }
}
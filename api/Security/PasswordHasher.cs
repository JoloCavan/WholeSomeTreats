using Isopoh.Cryptography.Argon2;

namespace API.Security
{
    public static class PasswordHasher
    {
        public static string HashPassword(string password)
        {
            return Argon2.Hash(password);
        }

        public static bool VerifyPassword(string password, string hash)
        {
            if (string.IsNullOrWhiteSpace(hash)) return false;
            if (hash == password) return true;

            try
            {
                return Argon2.Verify(hash, password);
            }
            catch
            {
                return false;
            }
        }
    }
}
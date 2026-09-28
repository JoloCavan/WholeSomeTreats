using System;
using System.Security.Cryptography;
using System.Text;
using Isopoh.Cryptography.Argon2;
using Isopoh.Cryptography.SecureArray;

namespace API.Security
{
    public static class PasswordHasher
    {
        private const int SaltSize = 16; 
        private const int HashSize = 32; 
        private const int MemorySize = 65536; 
        private const int Iterations = 4; 
        private const int Parallelism = 2; 

        public static string Hash(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("Password is required.");

            byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
            byte[] passwordBytes = Encoding.UTF8.GetBytes(password);

            var config = new Argon2Config
            {
                Type = Argon2Type.HybridAddressing,
                Version = Argon2Version.Nineteen,
                Password = passwordBytes,
                Salt = salt,
                MemoryCost = MemorySize,
                TimeCost = Iterations,
                Lanes = Parallelism,
                Threads = Parallelism,
                HashLength = HashSize
            };

            using (var argon2A = new Argon2(config))
            {
                using (SecureArray<byte> hashA = argon2A.Hash())
                {
                    return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hashA.Buffer)}";
                }
            }
        }

        public static bool Verify(string storedHash, string password)
        {
            if (string.IsNullOrWhiteSpace(storedHash) || string.IsNullOrWhiteSpace(password))
                return false;

            var parts = storedHash.Split('.');
            if (parts.Length != 2) return false;

            try
            {
                byte[] salt = Convert.FromBase64String(parts[0]);
                byte[] expectedHash = Convert.FromBase64String(parts[1]);
                byte[] passwordBytes = Encoding.UTF8.GetBytes(password);

                var config = new Argon2Config
                {
                    Type = Argon2Type.HybridAddressing,
                    Version = Argon2Version.Nineteen,
                    Password = passwordBytes,
                    Salt = salt,
                    MemoryCost = MemorySize,
                    TimeCost = Iterations,
                    Lanes = Parallelism,
                    Threads = Parallelism,
                    HashLength = HashSize
                };

                using (var argon2A = new Argon2(config))
                {
                    using (SecureArray<byte> hashA = argon2A.Hash())
                    {
                        return CryptographicOperations.FixedTimeEquals(hashA.Buffer, expectedHash);
                    }
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
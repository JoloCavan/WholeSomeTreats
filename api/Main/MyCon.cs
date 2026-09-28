using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using System.IO;
using Npgsql;

namespace API.Main
{
    public sealed class MyCon
    {
        private readonly string _connectionString;
        public int? DefaultCommandTimeoutSeconds { get; } = 30;

        private static (string host, string port, string database, string username, string password) LoadConfiguration()
        {
            // Look for the conn.env file in the current directory
            string configFile = Path.Combine(Directory.GetCurrentDirectory(), "conn.env");
            
            var config = new Dictionary<string, string>();

            // Read the file line-by-line if it exists
            if (File.Exists(configFile))
            {
                foreach (var line in File.ReadAllLines(configFile))
                {
                    if (!string.IsNullOrWhiteSpace(line) && !line.StartsWith("#"))
                    {
                        var parts = line.Split('=', 2);
                        if (parts.Length == 2)
                        {
                            config[parts[0].Trim()] = parts[1].Trim();
                        }
                    }
                }
            }

            // Return values from conn.env, falling back to defaults if missing
            return (
                config.GetValueOrDefault("DB_HOST", "localhost"),
                config.GetValueOrDefault("DB_PORT", "5432"),
                config.GetValueOrDefault("DB_DATABASE", "postgres"),
                config.GetValueOrDefault("DB_USERNAME", "postgres"),
                config.GetValueOrDefault("DB_PASSWORD", "Jolo123")
            );
        }

        public MyCon()
        {
            var config = LoadConfiguration();
            
            // Build the PostgreSQL connection string
            _connectionString = $"Host={config.host};Port={config.port};Database={config.database};Username={config.username};Password={config.password};Timeout={DefaultCommandTimeoutSeconds};";
        }

        public DbConnection GetConnection()
        {
            try
            {
                return new NpgsqlConnection(_connectionString);
            }
            catch (DbException ex)
            {
                throw new InvalidOperationException($"Database error creating connection: {ex.Message}", ex);
            }
        }

        public async Task<bool> CanConnectAsync(CancellationToken ct = default)
        {
            await using var conn = GetConnection();
            try
            {
                await conn.OpenAsync(ct).ConfigureAwait(false);
                return conn.State == ConnectionState.Open;
            }
            catch (DbException)
            {
                return false;
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    await conn.CloseAsync().ConfigureAwait(false);
            }
        }
    }
}
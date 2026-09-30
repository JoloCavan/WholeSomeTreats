#nullable enable
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;

namespace API.Main
{
    public abstract class BaseRepository
    {
        protected readonly MyCon _db;

        protected BaseRepository(MyCon dbConnection)
        {
            _db = dbConnection ?? throw new ArgumentNullException(nameof(dbConnection));
        }

        protected async Task<int> ExecuteNonQueryAsync(
            string sql,
            IEnumerable<DbParameter>? parameters = null,
            CancellationToken ct = default)
        {
            await using var connection = _db.GetConnection();
            await using var command = connection.CreateCommand();
            command.CommandText = sql;

            if (parameters != null)
            {
                foreach (var p in parameters)
                {
                    var clone = command.CreateParameter();
                    clone.ParameterName = p.ParameterName;
                    clone.Value = p.Value;
                    command.Parameters.Add(clone);
                }
            }

            await connection.OpenAsync(ct).ConfigureAwait(false);
            return await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        }

        protected async Task<object?> ExecuteScalarAsync(
            string sql,
            IEnumerable<DbParameter>? parameters = null,
            CancellationToken ct = default)
        {
            await using var connection = _db.GetConnection();
            await using var command = connection.CreateCommand();
            command.CommandText = sql;

            if (parameters != null)
            {
                foreach (var p in parameters)
                {
                    var clone = command.CreateParameter();
                    clone.ParameterName = p.ParameterName;
                    clone.Value = p.Value;
                    command.Parameters.Add(clone);
                }
            }

            await connection.OpenAsync(ct).ConfigureAwait(false);
            return await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        }

        protected async Task<List<T>> ExecuteReaderToListAsync<T>(
            string sql,
            Func<DbDataReader, T> mapper,
            IEnumerable<DbParameter>? parameters = null,
            CancellationToken ct = default)
        {
            var list = new List<T>();
            await using var connection = _db.GetConnection();
            await using var command = connection.CreateCommand();
            command.CommandText = sql;

            if (parameters != null)
            {
                foreach (var p in parameters)
                {
                    var clone = command.CreateParameter();
                    clone.ParameterName = p.ParameterName;
                    clone.Value = p.Value;
                    command.Parameters.Add(clone);
                }
            }

            await connection.OpenAsync(ct).ConfigureAwait(false);
            await using var reader = await command.ExecuteReaderAsync(CommandBehavior.CloseConnection, ct).ConfigureAwait(false);

            while (await reader.ReadAsync(ct).ConfigureAwait(false))
                list.Add(mapper(reader));

            return list;
        }

        protected DbParameter CreateParameter(string name, object? value)
        {
            using var conn = _db.GetConnection();
            using var cmd = conn.CreateCommand();
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value ?? DBNull.Value;
            return p;
        }
    }
}
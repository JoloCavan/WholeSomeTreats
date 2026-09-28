using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Threading.Tasks;
using API.Main;

namespace API.AnnouncementsModule
{
    public class AnnouncementRepository : BaseRepository, IAnnouncementRepository
    {
        public AnnouncementRepository(MyCon dbConnection) : base(dbConnection) { }

        private Announcement MapReaderToAnnouncement(DbDataReader reader)
        {
            return new Announcement
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Title = reader.GetString(reader.GetOrdinal("title")),
                Content = reader.GetString(reader.GetOrdinal("content")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
            };
        }

        public async Task<IEnumerable<Announcement>> GetAllAsync()
        {
            return await ExecuteReaderToListAsync("SELECT * FROM announcements ORDER BY created_at DESC", MapReaderToAnnouncement);
        }

        public async Task<int> AddAsync(Announcement announcement)
        {
            var sql = "INSERT INTO announcements (title, content, created_at) VALUES (@title, @content, NOW()) RETURNING id";
            await using var connection = _db.GetConnection();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.Add(CreateParameter("title", announcement.Title));
            cmd.Parameters.Add(CreateParameter("content", announcement.Content));
            
            await connection.OpenAsync();
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        public async Task DeleteAsync(int id)
        {
            await ExecuteNonQueryAsync("DELETE FROM announcements WHERE id = @id", new[] { CreateParameter("id", id) });
        }
    }
}
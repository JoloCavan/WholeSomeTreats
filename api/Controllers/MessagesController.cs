using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using API.Main;

namespace API.Controllers
{
    public class ChatMessageDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("sender_id")]
        public int SenderId { get; set; }

        [JsonPropertyName("sender_name")]
        public string SenderName { get; set; } = string.Empty;

        [JsonPropertyName("receiver_id")]
        public int ReceiverId { get; set; }

        [JsonPropertyName("receiver_name")]
        public string ReceiverName { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("image_url")]
        public string? ImageUrl { get; set; }

        [JsonPropertyName("created_at")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    }

    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly MyCon _dbConnection;

        public MessagesController(MyCon dbConnection)
        {
            _dbConnection = dbConnection;
        }

        [HttpGet]
        public async Task<IActionResult> GetMessages()
        {
            try
            {
                var messages = new List<ChatMessageDto>();
                using var conn = _dbConnection.GetConnection();
                await conn.OpenAsync();
                await using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT id, sender_id, sender_name, receiver_id, receiver_name, content, image_url, created_at FROM messages ORDER BY id ASC";

                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    messages.Add(new ChatMessageDto
                    {
                        Id = reader.GetInt32(0),
                        SenderId = reader.GetInt32(1),
                        SenderName = reader.GetString(2),
                        ReceiverId = reader.GetInt32(3),
                        ReceiverName = reader.GetString(4),
                        Content = reader.IsDBNull(5) ? "" : reader.GetString(5),
                        ImageUrl = reader.IsDBNull(6) ? null : reader.GetString(6),
                        CreatedAt = reader.IsDBNull(7) ? DateTime.UtcNow.ToString("o") : reader.GetDateTime(7).ToString("o")
                    });
                }

                return Ok(messages);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [GetMessages Error]: {ex.Message}");
                return Ok(new List<ChatMessageDto>());
            }
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageDto dto)
        {
            try
            {
                if (dto == null) return BadRequest(new { message = "Invalid message payload." });

                using var conn = _dbConnection.GetConnection();
                await conn.OpenAsync();
                await using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO messages (sender_id, sender_name, receiver_id, receiver_name, content, image_url, created_at)
                    VALUES (@senderId, @senderName, @receiverId, @receiverName, @content, @imageUrl, NOW())
                    RETURNING id, created_at;
                ";

                var p1 = cmd.CreateParameter(); p1.ParameterName = "senderId"; p1.Value = dto.SenderId; cmd.Parameters.Add(p1);
                var p2 = cmd.CreateParameter(); p2.ParameterName = "senderName"; p2.Value = dto.SenderName ?? "User"; cmd.Parameters.Add(p2);
                var p3 = cmd.CreateParameter(); p3.ParameterName = "receiverId"; p3.Value = dto.ReceiverId; cmd.Parameters.Add(p3);
                var p4 = cmd.CreateParameter(); p4.ParameterName = "receiverName"; p4.Value = dto.ReceiverName ?? "User"; cmd.Parameters.Add(p4);
                var p5 = cmd.CreateParameter(); p5.ParameterName = "content"; p5.Value = dto.Content ?? ""; cmd.Parameters.Add(p5);
                var p6 = cmd.CreateParameter(); p6.ParameterName = "imageUrl"; p6.Value = (object?)dto.ImageUrl ?? DBNull.Value; cmd.Parameters.Add(p6);

                await using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    dto.Id = reader.GetInt32(0);
                    dto.CreatedAt = reader.GetDateTime(1).ToString("o");
                }

                return Ok(dto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [SendMessage Error]: {ex.Message} \n{ex.StackTrace}");
                return StatusCode(500, new { message = "Failed to send message.", error = ex.Message });
            }
        }
    }
}

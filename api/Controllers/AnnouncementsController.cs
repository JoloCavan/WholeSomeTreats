using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using API.AnnouncementsModule;

namespace API.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/announcements")]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IAnnouncementRepository _repository;

        public AnnouncementsController(IAnnouncementRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Announcement>>> GetAll()
        {
            var announcements = await _repository.GetAllAsync();
            return Ok(announcements);
        }

        [HttpPost("admin/add")]
        public async Task<IActionResult> Add([FromBody] Announcement announcement)
        {
            if (string.IsNullOrWhiteSpace(announcement.Title))
            {
                return BadRequest(new { message = "Announcement title is required." });
            }

            int id = await _repository.AddAsync(announcement);
            return Ok(new { message = "Announcement posted successfully.", id = id });
        }

        [HttpDelete("admin/delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _repository.DeleteAsync(id);
            return Ok(new { message = "Announcement deleted." });
        }
    }
}
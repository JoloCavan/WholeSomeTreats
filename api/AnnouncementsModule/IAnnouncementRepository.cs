using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.AnnouncementsModule
{
    public interface IAnnouncementRepository
    {
        Task<IEnumerable<Announcement>> GetAllAsync();
        Task<int> AddAsync(Announcement announcement);
        Task DeleteAsync(int id);
    }
}
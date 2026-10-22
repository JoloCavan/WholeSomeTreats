namespace API.RatingsModule
{
    public class Rating
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = "";
        public int ProductId { get; set; }
        public int Stars { get; set; }
        public string Comment { get; set; } = "";
        public string CreatedAt { get; set; } = "";
    }
}

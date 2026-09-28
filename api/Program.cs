using System.Text;
using API.Main;
using API.ProductsModule;
using API.UsersModule;
using API.CartModule;
using API.OrdersModule;
using API.AnnouncementsModule;
using API.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5004");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 1. Configure Swagger to accept JWT Tokens visually
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    {
        Version = "v1",
        Title = "Wholesome Treats API",
        Description = "API for the Capstone Wholesome Treats Ordering System (PostgreSQL)"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new List<string>()
        }
    });
});

// 2. Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Bakery-API",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "Bakery-Client",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration["Jwt:Key"] ?? "your-super-secret-key-that-is-at-least-32-characters-long"))
    };
});

// 3. Configure Role-Based Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminAccess", policy => policy.RequireClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "admin"));
    options.AddPolicy("CustomerAccess", policy => policy.RequireClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "customer", "admin"));
});

// 4. Register Database Connection
builder.Services.AddScoped<MyCon>(_ => new MyCon());

// 5. Register Services & Repositories
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<IUserRepository, UserRepository>(sp =>
{
    var myCon = sp.GetRequiredService<MyCon>();
    return new UserRepository(myCon);
});

builder.Services.AddScoped<IProductsRepository, ProductsRepository>(sp =>
{
    var myCon = sp.GetRequiredService<MyCon>();
    return new ProductsRepository(myCon);
});

builder.Services.AddScoped<ICartRepository, CartRepository>(sp =>
{
    var myCon = sp.GetRequiredService<MyCon>();
    return new CartRepository(myCon);
});

builder.Services.AddScoped<IOrdersRepository, OrdersRepository>(sp =>
{
    var myCon = sp.GetRequiredService<MyCon>();
    return new OrdersRepository(myCon);
});

builder.Services.AddScoped<IAnnouncementRepository, AnnouncementRepository>(sp =>
{
    var myCon = sp.GetRequiredService<MyCon>();
    return new AnnouncementRepository(myCon);
});

// 6. Configure CORS for React integration later
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Auto-initialize PostgreSQL Database Tables
using (var scope = app.Services.CreateScope())
{
    var myCon = scope.ServiceProvider.GetRequiredService<MyCon>();
    await DbInitializer.InitializeAsync(myCon);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Wholesome Treats API V1");
        options.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

// 7. Enable Authentication & Authorization Middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
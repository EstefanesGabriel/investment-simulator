using Application;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using API.Servicos;

var construtor = WebApplication.CreateBuilder(args);
construtor.Services.AddControllers();
construtor.Services.AddOpenApi();
construtor.Services.AddProblemDetails();
construtor.Services.AddDbContext<Banco>(opcoes => opcoes.UseSqlite(
    construtor.Configuration.GetConnectionString("Banco") ?? "Data Source=simulador.db"));
construtor.Services.AddScoped<IRegistro>(servicos => servicos.GetRequiredService<Banco>());
construtor.Services.AddScoped<SimularJuros>();
construtor.Services.AddSingleton<ICatalogo>(new Catalogo(Path.Combine(construtor.Environment.ContentRootPath, "Configuracao")));
construtor.Services.AddSingleton(new ExecutorCobol(Path.GetFullPath(Path.Combine(construtor.Environment.ContentRootPath, "../../COBOL/bin"))));
construtor.Services.AddSingleton<IProjetor, Projetor>();
construtor.Services.AddHttpClient<IProvedorIndicadores, ProvedorBcb>(cliente => cliente.Timeout = TimeSpan.FromSeconds(12));
construtor.Services.AddSingleton<IndicadoresServico>();
construtor.Services.AddHostedService(servicos => servicos.GetRequiredService<IndicadoresServico>());
var nome = OperatingSystem.IsWindows() ? "juros.exe" : "juros";
construtor.Services.AddSingleton<IMotor>(new MotorCobol(Path.GetFullPath(Path.Combine(
    construtor.Environment.ContentRootPath, "../../COBOL/bin", nome))));
var app = construtor.Build();
app.UseExceptionHandler();
using (var escopo = app.Services.CreateScope())
    escopo.ServiceProvider.GetRequiredService<Banco>().Database.Migrate();
app.MapOpenApi();
app.MapControllers();
app.Run();

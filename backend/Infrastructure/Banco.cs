using Application;
using Domain;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

public class Banco(DbContextOptions<Banco> opcoes) : DbContext(opcoes), IRegistro
{
    public DbSet<Simulacao> Simulacoes => Set<Simulacao>();
    public DbSet<Indicador> Indicadores => Set<Indicador>();

    protected override void OnModelCreating(ModelBuilder modelo)
    {
        modelo.Entity<Indicador>().HasIndex(item => new { item.Codigo, item.Data, item.Fonte }).IsUnique();
    }

    public async Task Salvar(Simulacao simulacao, CancellationToken cancelamento)
    {
        Simulacoes.Add(simulacao);
        await SaveChangesAsync(cancelamento);
    }
}

using Application;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using Domain;

namespace API.Servicos;

public sealed class IndicadoresServico(IServiceScopeFactory escopos, ILogger<IndicadoresServico> logger, IConfiguration configuracao) : BackgroundService
{
    private readonly SemaphoreSlim trava = new(1);
    private DateTime ultimaTentativa = DateTime.MinValue;
    private string[] avisos = [];

    public string[] Avisos => avisos;
    public bool Atualizando => trava.CurrentCount == 0;

    public async Task Atualizar(CancellationToken cancelamento)
    {
        if (!await trava.WaitAsync(0, cancelamento)) return;
        try
        {
            if (DateTime.UtcNow - ultimaTentativa < TimeSpan.FromMinutes(5)) return;
            ultimaTentativa = DateTime.UtcNow;
            var falhas = new List<string>();
            foreach (var carregarHistorico in new[] { false, true })
            foreach (var codigo in new[] { "SELIC", "SELIC_DIARIA", "CDI", "IPCA", "USD" })
            {
                try
                {
                    using var escopo = escopos.CreateScope();
                    var provedor = escopo.ServiceProvider.GetRequiredService<IProvedorIndicadores>();
                    var banco = escopo.ServiceProvider.GetRequiredService<Banco>();
                    var existentes = await banco.Indicadores.Where(item => item.Codigo == codigo && item.Fonte != "Informado manualmente")
                        .ToDictionaryAsync(item => item.Data, cancelamento);
                    async Task Salvar(List<Indicador> lote)
                    {
                        foreach (var registro in lote)
                        {
                            if (existentes.TryGetValue(registro.Data, out var existente))
                            {
                                existente.Valor = registro.Valor;
                                existente.Compra = registro.Compra;
                                existente.AtualizadoEm = registro.AtualizadoEm;
                            }
                            else
                            {
                                banco.Indicadores.Add(registro);
                                existentes.Add(registro.Data, registro);
                            }
                        }
                        await banco.SaveChangesAsync(cancelamento);
                    }
                    if (!carregarHistorico)
                    {
                        await Salvar(await provedor.Consultar(codigo, cancelamento));
                        continue;
                    }
                    if (existentes.Count == 0) continue;
                    var inicio = ProvedorBcb.Hoje.AddYears(-10);
                    var maisAntigo = existentes.Keys.Min();
                    if (maisAntigo > inicio.AddDays(35))
                        await foreach (var lote in provedor.ConsultarHistorico(codigo, inicio, maisAntigo.AddDays(-1), cancelamento))
                            await Salvar(lote);
                }
                catch (Exception erro) when (!cancelamento.IsCancellationRequested)
                {
                    logger.LogWarning(erro, "Falha ao atualizar indicador {Codigo}", codigo);
                    falhas.Add($"{codigo}: fonte indisponível. Consulte os valores armazenados ou informe uma observação manual.");
                }
            }
            avisos = falhas.Distinct().ToArray();
        }
        finally { trava.Release(); }
    }

    protected override async Task ExecuteAsync(CancellationToken cancelamento)
    {
        if (!configuracao.GetValue("Indicadores:AtualizacaoAutomatica", true)) return;
        await Task.Yield();
        while (!cancelamento.IsCancellationRequested)
        {
            await Atualizar(cancelamento);
            await Task.Delay(TimeSpan.FromHours(6), cancelamento);
        }
    }
}

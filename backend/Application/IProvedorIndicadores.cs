using Domain;

namespace Application;

public interface IProvedorIndicadores
{
    Task<List<Indicador>> Consultar(string codigo, CancellationToken cancelamento);
    IAsyncEnumerable<List<Indicador>> ConsultarHistorico(string codigo, DateOnly inicio, DateOnly fim, CancellationToken cancelamento);
}

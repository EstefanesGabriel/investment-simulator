using Domain;
using System.ComponentModel.DataAnnotations;

namespace Application;

public record Entrada(
    [Range(typeof(decimal), "0.01", "100000000", ParseLimitsInInvariantCulture = true)] decimal Capital,
    [Range(typeof(decimal), "0", "5", ParseLimitsInInvariantCulture = true)] decimal Taxa,
    [Range(1, 360)] int Meses);

public interface IMotor
{
    Task<decimal> Calcular(Entrada entrada, CancellationToken cancelamento);
}

public interface IRegistro
{
    Task Salvar(Simulacao simulacao, CancellationToken cancelamento);
}

public class SimularJuros(IMotor motor, IRegistro registro)
{
    public async Task<Simulacao> Executar(Entrada entrada, CancellationToken cancelamento)
    {
        var resultado = new Simulacao { Capital = entrada.Capital, Taxa = entrada.Taxa,
            Meses = entrada.Meses, Montante = await motor.Calcular(entrada, cancelamento) };
        await registro.Salvar(resultado, cancelamento);
        return resultado;
    }
}


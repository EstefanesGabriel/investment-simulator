using System.Diagnostics;
using System.Globalization;
using Application;

namespace Infrastructure;

public sealed class MotorCobol(string executavel) : IMotor
{
    private readonly SemaphoreSlim vagas = new(4);

    public async Task<decimal> Calcular(Entrada entrada, CancellationToken cancelamento)
    {
        using var prazo = CancellationTokenSource.CreateLinkedTokenSource(cancelamento);
        prazo.CancelAfter(TimeSpan.FromSeconds(5));
        var token = prazo.Token;
        try
        {
            await vagas.WaitAsync(token);
            try { return await Executar(entrada, token); }
            finally { vagas.Release(); }
        }
        catch (OperationCanceledException) when (!cancelamento.IsCancellationRequested)
        {
            throw new TimeoutException("Tempo de cálculo excedido.");
        }
    }

    private async Task<decimal> Executar(Entrada entrada, CancellationToken token)
    {
        using var processo = new Process { StartInfo = new ProcessStartInfo(executavel)
        {
            UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true,
            RedirectStandardOutput = true, RedirectStandardError = true
        }};
        processo.Start();
        try
        {
            var saida = processo.StandardOutput.ReadToEndAsync(token);
            var erro = processo.StandardError.ReadToEndAsync(token);
            await processo.StandardInput.WriteAsync(FormattableString.Invariant(
                $"{entrada.Capital:F2}\n{entrada.Taxa:F4}\n{entrada.Meses}\n").AsMemory(), token);
            processo.StandardInput.Close();
            await processo.WaitForExitAsync(token);
            if (processo.ExitCode != 0)
                throw new InvalidOperationException($"Falha do motor: {await erro}");
            if (!decimal.TryParse((await saida).Trim(), NumberStyles.AllowDecimalPoint,
                CultureInfo.InvariantCulture, out var valor))
                throw new InvalidDataException("Resposta inválida do motor.");
            return valor;
        }
        finally
        {
            if (!processo.HasExited) processo.Kill(entireProcessTree: true);
        }
    }
}

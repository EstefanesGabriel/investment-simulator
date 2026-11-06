using System.Diagnostics;

namespace Infrastructure;

public sealed class ExecutorCobol(string diretorio)
{
    private readonly SemaphoreSlim vagas = new(4);

    public async Task<string> Executar(string programa, string entrada, CancellationToken cancelamento)
    {
        using var prazo = CancellationTokenSource.CreateLinkedTokenSource(cancelamento);
        prazo.CancelAfter(TimeSpan.FromSeconds(20));
        var token = prazo.Token;
        try
        {
            await vagas.WaitAsync(token);
            try
            {
                var nome = OperatingSystem.IsWindows() ? programa + ".exe" : programa;
                using var processo = new Process { StartInfo = new ProcessStartInfo(Path.Combine(diretorio, nome))
                {
                    UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true,
                    RedirectStandardOutput = true, RedirectStandardError = true
                }};
                processo.Start();
                try
                {
                    var saida = processo.StandardOutput.ReadToEndAsync(token);
                    var erro = processo.StandardError.ReadToEndAsync(token);
                    await processo.StandardInput.WriteAsync(entrada.AsMemory(), token);
                    processo.StandardInput.Close();
                    await processo.WaitForExitAsync(token);
                    if (processo.ExitCode != 0)
                        throw new InvalidOperationException($"Motor {programa}: {await erro}");
                    var resultado = await saida;
                    if (resultado.Length > 1000000) throw new InvalidDataException("Resposta excessiva do motor.");
                    return resultado;
                }
                finally
                {
                    if (!processo.HasExited) { processo.Kill(entireProcessTree: true); await processo.WaitForExitAsync(CancellationToken.None); }
                }
            }
            finally { vagas.Release(); }
        }
        catch (OperationCanceledException) when (!cancelamento.IsCancellationRequested)
        {
            throw new TimeoutException("Tempo de cálculo excedido.");
        }
    }
}

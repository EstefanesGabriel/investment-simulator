using Application;
using Domain;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/simulacoes")]
public class SimulacoesController(SimularJuros simular) : ControllerBase
{
    [HttpPost("juros-compostos")]
    public async Task<ActionResult<Simulacao>> Calcular(Entrada entrada, CancellationToken cancelamento)
    {
        if (entrada.Capital != decimal.Round(entrada.Capital, 2) || entrada.Taxa != decimal.Round(entrada.Taxa, 4))
            return Problem(statusCode: 400, detail: "Use até duas casas para o capital e quatro para a taxa.");
        return Ok(await simular.Executar(entrada, cancelamento));
    }
}

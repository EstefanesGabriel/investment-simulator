using Application;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/projecoes")]
public class ProjecoesController(IProjetor projetor, ICatalogo catalogo) : ControllerBase
{
    [HttpGet("catalogo")]
    public object Catalogo() => new { catalogo.Produtos, catalogo.Regras };

    [HttpPost]
    public async Task<ActionResult<List<Projecao>>> Comparar(Parametros parametros, CancellationToken cancelamento)
    {
        try
        {
            var resultados = new List<Projecao>();
            foreach (var investimento in parametros.Investimentos)
                resultados.Add(await projetor.Projetar(parametros, investimento, cancelamento));
            return Ok(resultados);
        }
        catch (ArgumentException erro) { return Problem(statusCode: 400, detail: erro.Message); }
        catch (TimeoutException) { return Problem(statusCode: 504, detail: "O cálculo excedeu o tempo permitido."); }
    }
}

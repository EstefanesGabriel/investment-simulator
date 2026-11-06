using API.Servicos;
using Domain;
using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers;

public record Observacao(
    [Required] string Codigo, DateOnly Data,
    [Range(typeof(decimal), "-100", "100000", ParseLimitsInInvariantCulture = true)] decimal Valor,
    [Range(typeof(decimal), "0.000001", "100000", ParseLimitsInInvariantCulture = true)] decimal? Compra);

[ApiController]
[Route("api/indicadores")]
public class IndicadoresController(Banco banco, IndicadoresServico servico) : ControllerBase
{
    [HttpGet]
    public async Task<object> Listar(CancellationToken cancelamento)
    {
        var hoje = ProvedorBcb.Hoje;
        var limite = hoje.AddYears(-10);
        var dados = await banco.Indicadores.AsNoTracking().Where(item => item.Data >= limite && item.Data <= hoje)
            .OrderBy(item => item.Data).ThenBy(item => item.AtualizadoEm).ToListAsync(cancelamento);
        return new { Dados = dados, servico.Avisos, servico.Atualizando };
    }

    [HttpPost("atualizar")]
    public async Task<object> Atualizar(CancellationToken cancelamento)
    {
        await servico.Atualizar(cancelamento);
        return await Listar(cancelamento);
    }

    [HttpPost("manual")]
    public async Task<ActionResult> Manual(Observacao entrada, CancellationToken cancelamento)
    {
        if ((!ProvedorBcb.Series.ContainsKey(entrada.Codigo) && entrada.Codigo != "USD") ||
            entrada.Data > ProvedorBcb.Hoje || entrada.Data.Year < 2000 ||
            (entrada.Codigo == "USD" && (entrada.Compra is null || entrada.Valor <= 0 || entrada.Compra > entrada.Valor)))
            return Problem(statusCode: 400, detail: "Código, data ou cotações inválidos.");
        const string fonte = "Informado manualmente";
        var compra = entrada.Codigo == "USD" ? entrada.Compra : null;
        var unidade = entrada.Codigo == "USD" ? "BRL por USD" : ProvedorBcb.Series[entrada.Codigo].Unidade;
        var atualizado = DateTime.UtcNow;
        await banco.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO Indicadores (Codigo, Data, Valor, Compra, Unidade, Fonte, AtualizadoEm)
            VALUES ({entrada.Codigo}, {entrada.Data}, {entrada.Valor}, {compra}, {unidade}, {fonte}, {atualizado})
            ON CONFLICT (Codigo, Data, Fonte) DO UPDATE SET
                Valor = excluded.Valor, Compra = excluded.Compra,
                Unidade = excluded.Unidade, AtualizadoEm = excluded.AtualizadoEm
            """, cancelamento);
        return NoContent();
    }
}

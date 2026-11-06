using Application;
using System.Text.Json;

namespace Infrastructure;

public sealed class Catalogo : ICatalogo
{
    public IReadOnlyList<Produto> Produtos { get; }
    public IReadOnlyList<RegraFiscal> Regras { get; }
    public Catalogo(string diretorio)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        Produtos = JsonSerializer.Deserialize<Produto[]>(File.ReadAllText(Path.Combine(diretorio, "produtos.json")), opcoes)
            ?? throw new InvalidDataException("Catálogo vazio.");
        Regras = JsonSerializer.Deserialize<RegraFiscal[]>(File.ReadAllText(Path.Combine(diretorio, "tributacao.json")), opcoes)
            ?? throw new InvalidDataException("Regras fiscais ausentes.");
        foreach (var regra in Regras)
            if (regra.IrRegressivo.Length != 4 || regra.Iof.Length != 30 ||
                regra.IrRegressivo.Any(taxa => taxa < 0 || taxa > 100) || regra.Iof.Any(taxa => taxa < 0 || taxa > 100) ||
                new[] { regra.IrAcoes, regra.IrFundosImobiliarios, regra.IrExterior, regra.IrDividendos }.Any(taxa => taxa < 0 || taxa > 100) ||
                regra.LimiteDividendos < 0 || regra.LimiteVendasAcoes < 0 || regra.Fim < regra.Inicio)
                throw new InvalidDataException("Tabela tributária inválida.");
        var ordenadas = Regras.OrderBy(regra => regra.Inicio).ToArray();
        for (var indice = 1; indice < ordenadas.Length; indice++)
            if (ordenadas[indice - 1].Fim is null || ordenadas[indice - 1].Fim >= ordenadas[indice].Inicio)
                throw new InvalidDataException("Vigências tributárias sobrepostas.");
    }
}

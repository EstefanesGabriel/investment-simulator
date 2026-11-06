using Application;
using Domain;
using System.Globalization;
using System.Text.Json;
using System.Runtime.CompilerServices;

namespace Infrastructure;

public sealed class ProvedorBcb(HttpClient cliente) : IProvedorIndicadores
{
    public static DateOnly Hoje => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Sao_Paulo"));
    public static readonly Dictionary<string, (int Serie, string Unidade)> Series = new()
    {
        ["SELIC"] = (432, "% a.a."), ["SELIC_DIARIA"] = (11, "% a.d."),
        ["CDI"] = (12, "% a.d."), ["IPCA"] = (433, "% a.m.")
    };

    public async Task<List<Indicador>> Consultar(string codigo, CancellationToken cancelamento)
    {
        var fim = Hoje;
        var inicio = fim.AddDays(codigo == "IPCA" ? -400 : -90);
        var resultado = await ConsultarIntervalo(codigo, inicio, fim, cancelamento);
        if (resultado.Count == 0) throw new InvalidDataException("A fonte não retornou observações.");
        return resultado;
    }

    public async IAsyncEnumerable<List<Indicador>> ConsultarHistorico(string codigo, DateOnly inicio, DateOnly fim,
        [EnumeratorCancellation] CancellationToken cancelamento)
    {
        if (inicio < Hoje.AddYears(-10) || fim > Hoje || inicio > fim)
            throw new ArgumentException("O histórico deve estar dentro dos últimos dez anos.");
        // Intervalos curtos evitam truncamento da PTAX e permitem salvar o progresso.
        for (var ultimo = fim; ultimo >= inicio;)
        {
            var primeiro = ultimo.AddDays(-89);
            if (primeiro < inicio) primeiro = inicio;
            yield return await ConsultarIntervalo(codigo, primeiro, ultimo, cancelamento);
            ultimo = primeiro.AddDays(-1);
            if (ultimo >= inicio) await Task.Delay(TimeSpan.FromMilliseconds(250), cancelamento);
        }
    }

    private async Task<List<Indicador>> ConsultarIntervalo(string codigo, DateOnly inicio, DateOnly fim, CancellationToken cancelamento)
    {
        string endereco;
        if (codigo == "USD")
        {
            endereco = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/" +
                "CotacaoDolarPeriodo(dataInicial=@inicio,dataFinalCotacao=@fim)" +
                $"?@inicio='{inicio:MM-dd-yyyy}'&@fim='{fim:MM-dd-yyyy}'&$format=json&$top=1000&$orderby=dataHoraCotacao";
        }
        else
        {
            var serie = Series[codigo].Serie;
            endereco = $"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados?formato=json&dataInicial={inicio:dd/MM/yyyy}&dataFinal={fim:dd/MM/yyyy}";
        }
        using var resposta = await cliente.GetAsync(endereco, cancelamento);
        resposta.EnsureSuccessStatusCode();
        using var documento = await JsonDocument.ParseAsync(await resposta.Content.ReadAsStreamAsync(cancelamento), cancellationToken: cancelamento);
        var linhas = codigo == "USD" ? documento.RootElement.GetProperty("value") : documento.RootElement;
        var resultado = new List<Indicador>();
        foreach (var linha in linhas.EnumerateArray())
        {
            var data = codigo == "USD"
                ? DateOnly.ParseExact(linha.GetProperty("dataHoraCotacao").GetString()![..10], "yyyy-MM-dd", CultureInfo.InvariantCulture)
                : DateOnly.ParseExact(linha.GetProperty("data").GetString()!, "dd/MM/yyyy", CultureInfo.InvariantCulture);
            if (data > fim || data < inicio) continue;
            var valor = codigo == "USD" ? linha.GetProperty("cotacaoVenda").GetDecimal()
                : decimal.Parse(linha.GetProperty("valor").GetString()!, CultureInfo.InvariantCulture);
            resultado.Add(new Indicador
            {
                Codigo = codigo, Data = data, Valor = valor,
                Compra = codigo == "USD" ? linha.GetProperty("cotacaoCompra").GetDecimal() : null,
                Unidade = codigo == "USD" ? "BRL por USD" : Series[codigo].Unidade,
                Fonte = codigo == "USD" ? "BCB PTAX — referência de fechamento" : $"BCB SGS {Series[codigo].Serie}",
                AtualizadoEm = DateTime.UtcNow
            });
        }
        if (codigo == "USD" && linhas.GetArrayLength() >= 1000)
            throw new InvalidDataException("O intervalo da PTAX excedeu o limite de registros.");
        return resultado.GroupBy(item => item.Data).Select(grupo => grupo.Last()).ToList();
    }
}

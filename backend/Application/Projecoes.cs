using System.ComponentModel.DataAnnotations;

namespace Application;

public sealed class Parametros : IValidatableObject
{
    [Range(typeof(decimal), "0.01", "100000000", ParseLimitsInInvariantCulture = true)]
    public decimal Capital { get; set; }
    [Range(typeof(decimal), "0", "1000000", ParseLimitsInInvariantCulture = true)]
    public decimal Aporte { get; set; }
    public DateOnly Inicio { get; set; }
    public DateOnly Fim { get; set; }
    public List<DateOnly> Feriados { get; set; } = [];
    [MinLength(1), MaxLength(8)]
    public List<Investimento> Investimentos { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext contexto)
    {
        if (Inicio.Year < 2026 || Fim <= Inicio || Fim > Inicio.AddYears(10))
            yield return new("Informe início a partir de 2026 e prazo de até dez anos.");
        if (Feriados.Count > 400) yield return new("Máximo de 400 feriados adicionais.");
        if (Investimentos.Any(item => item is null)) yield return new("Todos os investimentos devem ser preenchidos.");
        if (Capital != decimal.Round(Capital, 2) || Aporte != decimal.Round(Aporte, 2))
            yield return new("Capital e aporte devem ter até duas casas decimais.");
    }
}

public sealed class Investimento : IValidatableObject
{
    [Required, StringLength(60)] public string Nome { get; set; } = "";
    [Required] public string Produto { get; set; } = "CDB";
    [Required] public string Modalidade { get; set; } = "prefixado";
    [Range(typeof(decimal), "-90", "100", ParseLimitsInInvariantCulture = true)] public decimal Taxa { get; set; }
    [Range(typeof(decimal), "0", "300", ParseLimitsInInvariantCulture = true)] public decimal Percentual { get; set; } = 100;
    [Range(typeof(decimal), "-50", "100", ParseLimitsInInvariantCulture = true)] public decimal Indexador { get; set; }
    [Range(typeof(decimal), "-50", "100", ParseLimitsInInvariantCulture = true)] public decimal Inflacao { get; set; }
    [Range(typeof(decimal), "0", "20", ParseLimitsInInvariantCulture = true)] public decimal Administracao { get; set; }
    [Range(typeof(decimal), "0", "20", ParseLimitsInInvariantCulture = true)] public decimal Custodia { get; set; }
    [Range(typeof(decimal), "0", "1000", ParseLimitsInInvariantCulture = true)] public decimal Corretagem { get; set; }
    [Range(typeof(decimal), "0", "1000", ParseLimitsInInvariantCulture = true)] public decimal OutrosCustos { get; set; }
    [Range(typeof(decimal), "0", "50", ParseLimitsInInvariantCulture = true)] public decimal Dividendos { get; set; }
    [Range(typeof(decimal), "0", "100", ParseLimitsInInvariantCulture = true)] public decimal ImpostoDividendos { get; set; }
    [Range(typeof(decimal), "-90", "100", ParseLimitsInInvariantCulture = true)] public decimal Cambio { get; set; }
    [Range(typeof(decimal), "0", "100", ParseLimitsInInvariantCulture = true)] public decimal ImpostoExterior { get; set; }
    [Range(typeof(decimal), "0", "10", ParseLimitsInInvariantCulture = true)] public decimal TrMensal { get; set; }
    public bool Reinvestir { get; set; } = true;
    public bool IsencaoRendimentos { get; set; }
    public bool IsencaoVendasAcoes { get; set; }
    public bool CompensarImpostoExterior { get; set; }
    public bool DiasUteis { get; set; } = true;
    [StringLength(120)] public string Liquidez { get; set; } = "Conforme contrato";
    public DateOnly? Vencimento { get; set; }
    public string Cenario { get; set; } = "base";
    [MaxLength(120)] public List<MudancaCenario> Mudancas { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext contexto)
    {
        var taxas = new[] { Taxa, Percentual, Indexador, Inflacao, Administracao, Custodia, Dividendos,
            ImpostoDividendos, Cambio, ImpostoExterior, TrMensal };
        if (taxas.Any(taxa => taxa != decimal.Round(taxa, 8)))
            yield return new("As taxas admitem até oito casas decimais.");
        if (Corretagem != decimal.Round(Corretagem, 2) || OutrosCustos != decimal.Round(OutrosCustos, 2))
            yield return new("Os custos em reais admitem até duas casas decimais.");
        if (Produto == "FIA" && Dividendos != 0)
            yield return new("No fundo de ações, inclua os rendimentos na valorização da cota e mantenha os dividendos separados em zero.");
        if (Mudancas.Any(item => item is null)) yield return new("Preencha todas as mudanças de cenário.");
    }
}

public record MudancaCenario(
    DateOnly Data,
    [Range(typeof(decimal), "-90", "100", ParseLimitsInInvariantCulture = true)] decimal Taxa,
    [Range(typeof(decimal), "-50", "100", ParseLimitsInInvariantCulture = true)] decimal Indexador,
    [Range(typeof(decimal), "-50", "100", ParseLimitsInInvariantCulture = true)] decimal Inflacao,
    [Range(typeof(decimal), "-90", "100", ParseLimitsInInvariantCulture = true)] decimal Cambio);

public record Produto(string Codigo, string Nome, string Grupo, string Tributacao, string[] Modalidades,
    string Risco, string Observacao);
public record RegraFiscal(string Versao, DateOnly Inicio, DateOnly? Fim, string Fonte,
    decimal[] IrRegressivo, int[] Iof, decimal IrAcoes, decimal IrFundosImobiliarios, decimal IrExterior,
    decimal LimiteDividendos, decimal IrDividendos, decimal LimiteVendasAcoes);
public record Ponto(string Data, string Aplicado, string Bruto, string Liquido, string Ir, string Iof,
    string Administracao, string Custodia, string Corretagem, string OutrosCustos, string Proventos,
    string RentabilidadeBruta, string RentabilidadeLiquida, string GanhoReal, string Anualizada);
public record Projecao(Investimento Investimento, Produto Produto, string RegraFiscal, string[] Premissas, List<Ponto> Evolucao);
public interface IProjetor
{
    Task<Projecao> Projetar(Parametros parametros, Investimento investimento, CancellationToken cancelamento);
}
public interface ICatalogo
{
    IReadOnlyList<Produto> Produtos { get; }
    IReadOnlyList<RegraFiscal> Regras { get; }
}

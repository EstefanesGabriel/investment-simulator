using Application;
using System.Globalization;
using System.Text;

namespace Infrastructure;

public sealed class Projetor(ExecutorCobol executor, ICatalogo catalogo) : IProjetor
{
    public async Task<Projecao> Projetar(Parametros parametros, Investimento investimento, CancellationToken cancelamento)
    {
        var produto = catalogo.Produtos.SingleOrDefault(item => item.Codigo == investimento.Produto)
            ?? throw new ArgumentException("Produto desconhecido.");
        if (!produto.Modalidades.Contains(investimento.Modalidade))
            throw new ArgumentException("Modalidade incompatível com o produto.");
        if (investimento.Vencimento is not null && parametros.Fim > investimento.Vencimento)
            throw new ArgumentException("A projeção termina após o vencimento informado.");
        if (investimento.Produto == "POUPANCA" && parametros.Inicio.Day > 28)
            throw new ArgumentException("Para poupança, informe a data-base do próximo dia 1 para depósitos nos dias 29 a 31.");
        if (produto.Grupo == "fixa" && (investimento.Dividendos != 0 || investimento.Cambio != 0))
            throw new ArgumentException("Proventos e câmbio só se aplicam aos cenários de renda variável.");
        if (investimento.Cambio != 0 && investimento.Produto != "EXTERIOR")
            throw new ArgumentException("Variação cambial separada só se aplica a investimentos no exterior. Informe BDRs em reais.");
        if (investimento.IsencaoVendasAcoes && investimento.Produto != "ACOES")
            throw new ArgumentException("Isenção de vendas exclusiva de ações brasileiras.");
        if (!new[] { "pessimista", "base", "otimista" }.Contains(investimento.Cenario))
            throw new ArgumentException("Cenário desconhecido.");
        var regra = catalogo.Regras.Where(item => item.Inicio <= parametros.Inicio &&
            (item.Fim == null || item.Fim >= parametros.Fim)).OrderByDescending(item => item.Inicio).FirstOrDefault()
            ?? throw new ArgumentException("Nenhuma regra fiscal cobre todo o intervalo. Separe os períodos de vigência.");
        var regime = produto.Tributacao switch { "isento" => 0, "regressivo" => 1, "fundo-longo" => 3, "fundo-curto" => 4, _ => 2 };
        var aliquota = produto.Tributacao switch
        {
            "imobiliario" => regra.IrFundosImobiliarios,
            "exterior" => regra.IrExterior,
            _ => regra.IrAcoes
        };
        var impostoDividendos = produto.Tributacao switch
        {
            "imobiliario" => investimento.IsencaoRendimentos ? 0 : regra.IrFundosImobiliarios,
            "exterior" => regra.IrExterior,
            _ => investimento.ImpostoDividendos
        };
        var modalidade = investimento.Modalidade switch
        {
            "cdi" or "selic" => 2, "ipca" => 3, "poupanca" => 4, _ => 1
        };
        var entrada = new StringBuilder("VERTICE-1\n");
        void Adicionar(object valor) => entrada.Append(Convert.ToString(valor, CultureInfo.InvariantCulture)).Append('\n');
        foreach (var valor in new object[] { parametros.Capital, parametros.Aporte, modalidade,
            investimento.Taxa, investimento.Indexador, investimento.Percentual, investimento.Inflacao,
            investimento.Administracao, investimento.Custodia, investimento.Corretagem, investimento.OutrosCustos,
            investimento.Dividendos, impostoDividendos, investimento.Cambio, investimento.TrMensal, regime,
            aliquota, investimento.Reinvestir ? 1 : 0, investimento.DiasUteis && produto.Grupo == "fixa" ? 252 : 365,
            investimento.Produto == "ACOES" ? 1 : 0, investimento.IsencaoVendasAcoes ? 1 : 0 })
            Adicionar(valor);
        Adicionar(investimento.Produto == "EXTERIOR" ? investimento.ImpostoExterior : 0);
        Adicionar(regra.LimiteDividendos);
        Adicionar(regra.IrDividendos);
        Adicionar(regra.LimiteVendasAcoes);
        Adicionar(investimento.CompensarImpostoExterior ? 1 : 0);
        Adicionar(investimento.Produto is "FUNDO_LP" or "FUNDO_CP" or "FIA" ? 1 : 0);
        foreach (var taxa in regra.IrRegressivo) Adicionar(taxa);
        foreach (var taxa in regra.Iof) Adicionar(taxa);
        var aniversarios = new HashSet<DateOnly>();
        for (var mes = 1; parametros.Inicio.AddMonths(mes) < parametros.Fim; mes++)
            aniversarios.Add(parametros.Inicio.AddMonths(mes));
        if (investimento.Mudancas.Any(mudanca => !aniversarios.Contains(mudanca.Data)) ||
            investimento.Mudancas.Select(mudanca => mudanca.Data).Distinct().Count() != investimento.Mudancas.Count)
            throw new ArgumentException("Mudanças de cenário devem ter datas únicas nos aniversários mensais, antes da data final.");
        if (investimento.Produto != "EXTERIOR" && investimento.Mudancas.Any(mudanca => mudanca.Cambio != 0))
            throw new ArgumentException("Variação cambial separada só se aplica ao produto Exterior.");
        var datasTributos = new HashSet<DateOnly>();
        if (regime is 3 or 4)
            for (var ano = parametros.Inicio.Year; ano <= parametros.Fim.Year; ano++)
                foreach (var mes in new[] { 5, 11 })
                {
                    var dataTributo = new DateOnly(ano, mes, DateTime.DaysInMonth(ano, mes));
                    while (!Calendario.Util(dataTributo, parametros.Feriados)) dataTributo = dataTributo.AddDays(-1);
                    if (dataTributo > parametros.Inicio && dataTributo < parametros.Fim) datasTributos.Add(dataTributo);
                }
        var datas = aniversarios.Concat(datasTributos).Append(parametros.Fim).Distinct().Order().ToList();
        var mesesFinais = (parametros.Fim.Year - parametros.Inicio.Year) * 12 + parametros.Fim.Month - parametros.Inicio.Month;
        if (parametros.Inicio.AddMonths(mesesFinais) == parametros.Fim) aniversarios.Add(parametros.Fim);
        Adicionar(datas.Count);
        var anterior = parametros.Inicio;
        foreach (var data in datas)
        {
            Adicionar(data.ToString("yyyyMMdd"));
            Adicionar(data.DayNumber - anterior.DayNumber);
            var uteis = 0;
            for (var dia = anterior; dia < data; dia = dia.AddDays(1))
                if (Calendario.Util(dia, parametros.Feriados)) uteis++;
            Adicionar(uteis);
            var aniversario = aniversarios.Contains(data);
            Adicionar(aniversario ? 1 : 0);
            Adicionar(aniversario && data < parametros.Fim ? 1 : 0);
            Adicionar(datasTributos.Contains(data) ? 1 : 0);
            var mudanca = investimento.Mudancas.Where(item => item.Data <= anterior).OrderBy(item => item.Data).LastOrDefault();
            Adicionar(mudanca?.Taxa ?? investimento.Taxa);
            Adicionar(mudanca?.Indexador ?? investimento.Indexador);
            Adicionar(mudanca?.Inflacao ?? investimento.Inflacao);
            Adicionar(mudanca?.Cambio ?? investimento.Cambio);
            anterior = data;
        }
        var resposta = await executor.Executar("projecao", entrada.ToString(), cancelamento);
        var pontos = new List<Ponto>();
        foreach (var linha in resposta.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var campos = linha.Split('|');
            if (campos.Length != 15 || !DateOnly.TryParseExact(campos[0], "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var data) ||
                campos.Skip(1).Take(13).Any(campo => !decimal.TryParse(campo, NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out _)) ||
                campos[14] != "NA" && !decimal.TryParse(campos[14], NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out _))
                throw new InvalidDataException("Contrato do motor inválido.");
            pontos.Add(new(data.ToString("yyyy-MM-dd"), campos[1], campos[2], campos[3], campos[4], campos[5],
                campos[6], campos[7], campos[8], campos[9], campos[10], campos[11], campos[12], campos[13], campos[14]));
        }
        if (pontos.Count != datas.Count) throw new InvalidDataException("Projeção incompleta.");
        pontos = pontos.Where(ponto => aniversarios.Contains(DateOnly.ParseExact(ponto.Data, "yyyy-MM-dd", CultureInfo.InvariantCulture)) ||
            ponto.Data == parametros.Fim.ToString("yyyy-MM-dd")).ToList();
        return new(investimento, produto, regra.Versao,
        [
            produto.Observacao,
            "Premissas manuais, constantes entre as mudanças mensais informadas. Aportes mensais ao fim de cada período, exceto na data final.",
            "Custos estimados sobre o saldo inicial de cada período. Nos fundos, administração e custódia reduzem as cotas antes do IR. Nos demais produtos são descontados no resgate. Corretagem por compra e outros custos únicos.",
            "Rentabilidade anualizada pela TIR dos aportes e do valor líquido final. Proventos não reinvestidos ficam em caixa sem juros.",
            "Liquidação hipotética em cada ponto, sujeita à liquidez contratada. Calendário nacional acrescido dos feriados informados.",
            "Pessoa física residente no Brasil. Estimativa por produto, sem compensação de perdas entre operações ou ajuste anual de altas rendas.",
            produto.Grupo == "variavel" ? "Renda variável pode gerar perdas. Cenários não garantem resultados. Impostos de ganhos simulam venda integral na data final." : "Taxas futuras e inflação são hipóteses, sujeitas a mudanças."
        ], pontos);
    }
}

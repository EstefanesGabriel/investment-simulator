namespace Domain;

public class Indicador
{
    public int Id { get; set; }
    public string Codigo { get; set; } = "";
    public DateOnly Data { get; set; }
    public decimal Valor { get; set; }
    public decimal? Compra { get; set; }
    public string Unidade { get; set; } = "";
    public string Fonte { get; set; } = "";
    public DateTime AtualizadoEm { get; set; }
}

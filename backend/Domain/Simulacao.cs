namespace Domain;

public class Simulacao
{
    public int Id { get; set; }
    public decimal Capital { get; set; }
    public decimal Taxa { get; set; }
    public int Meses { get; set; }
    [System.Text.Json.Serialization.JsonNumberHandling(System.Text.Json.Serialization.JsonNumberHandling.WriteAsString)]
    public decimal Montante { get; set; }
}


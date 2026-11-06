namespace Infrastructure;

public static class Calendario
{
    public static bool Util(DateOnly data, ICollection<DateOnly> adicionais)
    {
        if (data.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday || adicionais.Contains(data)) return false;
        var fixos = new[] { (1, 1), (4, 21), (5, 1), (9, 7), (10, 12), (11, 2), (11, 15), (11, 20), (12, 25) };
        if (fixos.Contains((data.Month, data.Day))) return false;
        // Algoritmo gregoriano para a data da Páscoa.
        var ano = data.Year;
        var a = ano % 19;
        var b = ano / 100;
        var c = ano % 100;
        var d = b / 4;
        var e = b % 4;
        var f = (b + 8) / 25;
        var g = (b - f + 1) / 3;
        var h = (19 * a + b - d - g + 15) % 30;
        var i = c / 4;
        var k = c % 4;
        var l = (32 + 2 * e + 2 * i - h - k) % 7;
        var m = (a + 11 * h + 22 * l) / 451;
        var mes = (h + l - 7 * m + 114) / 31;
        var dia = (h + l - 7 * m + 114) % 31 + 1;
        var pascoa = new DateOnly(ano, mes, dia);
        return data != pascoa.AddDays(-48) && data != pascoa.AddDays(-47) &&
            data != pascoa.AddDays(-2) && data != pascoa.AddDays(60);
    }
}

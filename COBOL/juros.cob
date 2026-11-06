>>source format free
identification division.
program-id. juros.
data division.
working-storage section.
01 linha pic x(64).
01 capital pic 9(18)v99.
01 taxa pic 99v9(4).
01 meses pic 999.
01 saldo pic 9(18)v9(12).
01 montante pic 9(18)v99.
01 saida pic 9(18).99.
procedure division.
    accept linha
    if function test-numval(linha) not = 0 perform falhar end-if
    compute capital = function numval(linha)
    accept linha
    if function test-numval(linha) not = 0 perform falhar end-if
    compute taxa = function numval(linha)
    accept linha
    if function test-numval(linha) not = 0 perform falhar end-if
    compute meses = function numval(linha)
    move capital to saldo
    perform meses times
        compute saldo rounded = saldo * (1 + taxa / 100)
            on size error perform falhar
        end-compute
    end-perform
    compute montante rounded = saldo on size error perform falhar end-compute
    move montante to saida
    display saida
    stop run.
falhar.
    display "Entrada invalida ou limite excedido" upon stderr
    move 2 to return-code
    stop run.

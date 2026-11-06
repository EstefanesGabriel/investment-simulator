>>source format free
identification division.
program-id. tributacao.
data division.
working-storage section.
01 aliquota pic s9(4)v9(8) comp-3.
linkage section.
01 ganho pic s9(18)v9(8) comp-3.
01 idade binary-long.
01 regime binary-long.
01 tabela-ir.
  02 ir-faixa pic s9(4)v9(8) comp-3 occurs 4.
01 tabela-iof.
  02 iof-dia binary-long occurs 30.
01 ir-fixo pic s9(4)v9(8) comp-3.
01 ir pic s9(18)v99 comp-3.
01 iof pic s9(18)v99 comp-3.
procedure division using ganho idade regime tabela-ir tabela-iof
    ir-fixo ir iof.
    move 0 to ir iof
    if ganho <= 0 or regime = 0 goback end-if
    move ir-fixo to aliquota
    if regime = 1 or regime = 3 or regime = 4
      evaluate true
        when idade <= 180 move ir-faixa(1) to aliquota
        when idade <= 360 move ir-faixa(2) to aliquota
        when idade <= 720 move ir-faixa(3) to aliquota
        when other move ir-faixa(4) to aliquota
      end-evaluate
      if regime = 4 and idade > 180
        move ir-faixa(2) to aliquota
      end-if
      if idade > 0 and idade < 30
        compute iof rounded = ganho * iof-dia(idade) / 100
      end-if
    end-if
    compute ir rounded = (ganho - iof) * aliquota / 100
    goback.

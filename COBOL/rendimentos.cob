>>source format free
identification division.
program-id. rendimentos.
data division.
linkage section.
01 modalidade binary-long.
01 taxa pic s9(4)v9(8) comp-3.
01 indice pic s9(4)v9(8) comp-3.
01 percentual pic s9(4)v9(8) comp-3.
01 tr-mensal pic s9(4)v9(8) comp-3.
01 dias binary-long.
01 uteis binary-long.
01 base-dias binary-long.
01 aniversario binary-long.
01 fator pic s9(6)v9(14) comp-3.
procedure division using modalidade taxa indice percentual tr-mensal
    dias uteis base-dias aniversario fator.
    move 1 to fator
    evaluate modalidade
      when 1
        if base-dias = 252
          compute fator = (1 + taxa / 100) ** (uteis / 252)
        else
          compute fator = (1 + taxa / 100) ** (dias / 365)
        end-if
      when 2
        compute fator = (1 + ((1 + indice / 100) **
            (1 / 252) - 1) * percentual / 100) ** uteis
        compute fator = fator * (1 + taxa / 100) ** (uteis / 252)
      when 3
        compute fator = ((1 + indice / 100) * (1 + taxa / 100))
            ** (dias / 365)
      when 4
        if aniversario = 1
          if indice > 8.5
            compute fator = 1.005 * (1 + tr-mensal / 100)
          else
            compute fator = (1 + indice * 0.7 / 100) **
                (1 / 12) * (1 + tr-mensal / 100)
          end-if
        end-if
    end-evaluate
    goback.

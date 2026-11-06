>>source format free
identification division.
program-id. projecao.
data division.
working-storage section.
01 linha pic x(256).
01 capital pic s9(18)v9(8) comp-3.
01 aporte pic s9(18)v9(8) comp-3.
01 taxa pic s9(4)v9(8) comp-3.
01 indice pic s9(4)v9(8) comp-3.
01 percentual pic s9(4)v9(8) comp-3.
01 inflacao pic s9(4)v9(8) comp-3.
01 administracao pic s9(4)v9(8) comp-3.
01 custodia pic s9(4)v9(8) comp-3.
01 corretagem pic s9(18)v9(8) comp-3.
01 outros pic s9(18)v9(8) comp-3.
01 dividendos pic s9(4)v9(8) comp-3.
01 imposto-dividendos pic s9(4)v9(8) comp-3.
01 cambio pic s9(4)v9(8) comp-3.
01 tr-mensal pic s9(4)v9(8) comp-3.
01 ir-fixo pic s9(4)v9(8) comp-3.
01 imposto-exterior pic s9(4)v9(8) comp-3.
01 limite-dividendos pic s9(18)v9(8) comp-3.
01 ir-dividendos pic s9(4)v9(8) comp-3.
01 limite-vendas pic s9(18)v9(8) comp-3.
01 ganho-total pic s9(18)v9(8) comp-3.
01 compensar-exterior binary-long.
01 custos-internos binary-long.
01 saldo-anterior-lote pic s9(18)v9(8) comp-3.
01 tabela-ir.
  02 ir-faixa pic s9(4)v9(8) comp-3 occurs 4.
01 tabela-iof.
  02 iof-dia binary-long occurs 30.
01 modalidade binary-long.
01 regime binary-long.
01 reinvestir binary-long.
01 base-dias binary-long.
01 dividendos-brasileiros binary-long.
01 isencao-acoes binary-long.
01 quantidade binary-long.
01 periodo binary-long.
01 total-lotes binary-long value 1.
01 lote binary-long.
01 indice-tabela binary-long.
01 dias binary-long.
01 uteis binary-long.
01 idade binary-long.
01 acumulado binary-long value 0.
01 aniversario binary-long.
01 novo-aporte binary-long.
01 dia-come-cotas binary-long.
01 ganho-come pic s9(18)v9(8) comp-3.
01 taxa-come pic s9(4)v9(8) comp-3.
01 ir-come pic s9(18)v99 comp-3.
01 total-antecipado pic s9(18)v9(8) comp-3 value 0.
01 data-ponto pic 9(8).
01 fator pic s9(6)v9(14) comp-3.
01 fator-cambio pic s9(6)v9(14) comp-3.
01 ganho pic s9(18)v9(8) comp-3.
01 ir pic s9(18)v99 comp-3.
01 iof pic s9(18)v99 comp-3.
01 lotes.
  02 item occurs 241.
    03 principal pic s9(18)v9(8) comp-3.
    03 saldo pic s9(18)v9(8) comp-3.
    03 nascimento binary-long.
    03 base-come pic s9(18)v9(8) comp-3.
    03 lucro-realizado pic s9(18)v9(8) comp-3.
    03 antecipado pic s9(18)v9(8) comp-3.
01 aplicado pic s9(18)v9(8) comp-3.
01 bruto pic s9(18)v9(8) comp-3.
01 liquido pic s9(18)v9(8) comp-3.
01 total-ir pic s9(18)v9(8) comp-3.
01 total-iof pic s9(18)v9(8) comp-3.
01 custo-adm pic s9(18)v9(8) comp-3 value 0.
01 custo-custodia pic s9(18)v9(8) comp-3 value 0.
01 custo-corretagem pic s9(18)v9(8) comp-3.
01 custo-outros pic s9(18)v9(8) comp-3.
01 proventos pic s9(18)v9(8) comp-3 value 0.
01 caixa pic s9(18)v9(8) comp-3 value 0.
01 ir-proventos pic s9(18)v9(8) comp-3 value 0.
01 dividendo-periodo pic s9(18)v99 comp-3.
01 imposto-periodo pic s9(18)v99 comp-3.
01 dividendo-liquido pic s9(18)v9(8) comp-3.
01 saldo-inicial pic s9(18)v9(8) comp-3.
01 rent-bruta pic s9(18)v9(8) comp-3.
01 rent-liquida pic s9(18)v9(8) comp-3.
01 ganho-real pic s9(18)v9(8) comp-3.
01 fator-inflacao pic s9(12)v9(14) comp-3 value 1.
01 aplicado-real pic s9(18)v9(8) comp-3.
01 anualizada pic s9(18)v9(8) comp-3.
01 fluxos.
  02 fluxo occurs 121.
    03 valor-fluxo pic s9(18)v9(8) comp-3.
    03 dia-fluxo binary-long.
01 total-fluxos binary-long value 1.
01 limite-inferior pic s9(6)v9(12) comp-3.
01 limite-superior pic s9(6)v9(12) comp-3.
01 tentativa pic s9(6)v9(12) comp-3.
01 valor-futuro pic s9(24)v9(8) comp-3.
01 repeticao binary-long.
01 numero-saida pic -(18)9.99.
procedure division.
    accept linha
    if linha not = "VERTICE-1" perform falhar end-if
    perform ler-numero move function numval(linha) to capital
    perform ler-numero move function numval(linha) to aporte
    perform ler-numero move function numval(linha) to modalidade
    perform ler-numero move function numval(linha) to taxa
    perform ler-numero move function numval(linha) to indice
    perform ler-numero move function numval(linha) to percentual
    perform ler-numero move function numval(linha) to inflacao
    perform ler-numero move function numval(linha) to administracao
    perform ler-numero move function numval(linha) to custodia
    perform ler-numero move function numval(linha) to corretagem
    perform ler-numero move function numval(linha) to outros
    perform ler-numero move function numval(linha) to dividendos
    perform ler-numero move function numval(linha) to imposto-dividendos
    perform ler-numero move function numval(linha) to cambio
    perform ler-numero move function numval(linha) to tr-mensal
    perform ler-numero move function numval(linha) to regime
    perform ler-numero move function numval(linha) to ir-fixo
    perform ler-numero move function numval(linha) to reinvestir
    perform ler-numero move function numval(linha) to base-dias
    perform ler-numero move function numval(linha) to dividendos-brasileiros
    perform ler-numero move function numval(linha) to isencao-acoes
    perform ler-numero move function numval(linha) to imposto-exterior
    perform ler-numero move function numval(linha) to limite-dividendos
    perform ler-numero move function numval(linha) to ir-dividendos
    perform ler-numero move function numval(linha) to limite-vendas
    perform ler-numero move function numval(linha) to compensar-exterior
    perform ler-numero move function numval(linha) to custos-internos
    if compensar-exterior = 1
      compute imposto-dividendos =
          function max(imposto-exterior, imposto-dividendos)
    else
      add imposto-exterior to imposto-dividendos
    end-if
    perform varying indice-tabela from 1 by 1 until indice-tabela > 4
      perform ler-numero
      move function numval(linha) to ir-faixa(indice-tabela)
    end-perform
    perform varying indice-tabela from 1 by 1 until indice-tabela > 30
      perform ler-numero
      move function numval(linha) to iof-dia(indice-tabela)
    end-perform
    perform ler-numero move function numval(linha) to quantidade
    if capital <= 0 or quantidade < 1 or quantidade > 161
        perform falhar end-if
    move capital to principal(1) saldo(1) aplicado valor-fluxo(1)
    move capital to base-come(1)
    move capital to aplicado-real
    move 0 to nascimento(1) dia-fluxo(1)
    move corretagem to custo-corretagem
    move outros to custo-outros
    perform varying periodo from 1 by 1 until periodo > quantidade
      perform ler-numero move function numval(linha) to data-ponto
      perform ler-numero move function numval(linha) to dias
      perform ler-numero move function numval(linha) to uteis
      perform ler-numero move function numval(linha) to aniversario
      perform ler-numero move function numval(linha) to novo-aporte
      perform ler-numero move function numval(linha) to dia-come-cotas
      perform ler-numero move function numval(linha) to taxa
      perform ler-numero move function numval(linha) to indice
      perform ler-numero move function numval(linha) to inflacao
      perform ler-numero move function numval(linha) to cambio
      add dias to acumulado
      compute fator-inflacao = fator-inflacao *
          (1 + inflacao / 100) ** (dias / 365)
      call "rendimentos" using modalidade taxa indice percentual
          tr-mensal dias uteis base-dias aniversario fator
      compute fator-cambio = (1 + cambio / 100) ** (dias / 365)
      move 0 to saldo-inicial
      perform varying lote from 1 by 1 until lote > total-lotes
        add saldo(lote) to saldo-inicial
        move saldo(lote) to saldo-anterior-lote
        compute saldo(lote) = saldo(lote) * fator * fator-cambio
          on size error perform falhar
        end-compute
        if custos-internos = 1
          compute saldo(lote) = saldo(lote) - saldo-anterior-lote *
              (administracao + custodia) / 100 * dias / 365
        end-if
      end-perform
      compute custo-adm = custo-adm +
          saldo-inicial * administracao / 100 * dias / 365
      compute custo-custodia = custo-custodia +
          saldo-inicial * custodia / 100 * dias / 365
      if dia-come-cotas = 1 perform antecipar-imposto end-if
      if aniversario = 1
        compute dividendo-periodo rounded =
            saldo-inicial * dividendos / 100 / 12
        compute imposto-periodo rounded =
            dividendo-periodo * imposto-dividendos / 100
        if dividendos-brasileiros = 1
            and dividendo-periodo > limite-dividendos
          compute imposto-periodo rounded =
              dividendo-periodo * ir-dividendos / 100
        end-if
        add imposto-periodo to ir-proventos
        add dividendo-periodo to proventos
        compute dividendo-liquido = dividendo-periodo - imposto-periodo
        if reinvestir = 1 and dividendo-liquido > 0
          add 1 to total-lotes
          move dividendo-liquido to principal(total-lotes)
              saldo(total-lotes)
          move acumulado to nascimento(total-lotes)
        else
          add dividendo-liquido to caixa
        end-if
      end-if
      if novo-aporte = 1 and aporte > 0
        add 1 to total-lotes total-fluxos
        move aporte to principal(total-lotes) saldo(total-lotes)
            valor-fluxo(total-fluxos) base-come(total-lotes)
        move acumulado to nascimento(total-lotes) dia-fluxo(total-fluxos)
        add aporte to aplicado
        compute aplicado-real = aplicado-real + aporte / fator-inflacao
        add corretagem to custo-corretagem
      end-if
      perform consolidar
      perform imprimir
    end-perform
    stop run.
consolidar.
    move caixa to bruto
    move ir-proventos to total-ir
    add total-antecipado to total-ir
    move 0 to total-iof
    move 0 to ganho-total
    perform varying lote from 1 by 1 until lote > total-lotes
      add saldo(lote) to bruto
    end-perform
    perform varying lote from 1 by 1 until lote > total-lotes
      compute ganho = saldo(lote) - principal(lote)
      if regime = 3 or regime = 4
        compute ganho = lucro-realizado(lote) +
            saldo(lote) - base-come(lote)
      end-if
      add ganho to ganho-total
      compute idade = acumulado - nascimento(lote)
      call "tributacao" using ganho idade regime tabela-ir tabela-iof
          ir-fixo ir iof
      if regime = 3 or regime = 4
        compute ir = function max(0, ir - antecipado(lote))
      end-if
      if regime not = 2
        add ir to total-ir
        add iof to total-iof
      end-if
    end-perform
    if regime = 2
      move ganho-total to ganho
      call "tributacao" using ganho idade regime tabela-ir tabela-iof
          ir-fixo ir iof
      if isencao-acoes = 1 and bruto - caixa <= limite-vendas
        move 0 to ir
      end-if
      add ir to total-ir
    end-if
    *> Bruto inclui imposto de proventos já retido, para reconciliação.
    add ir-proventos to bruto
    add total-antecipado to bruto
    if custos-internos = 1 add custo-adm custo-custodia to bruto end-if
    call "consolidacao" using aplicado bruto total-ir total-iof
        custo-adm custo-custodia custo-corretagem custo-outros
        liquido rent-bruta rent-liquida
    compute ganho-real = liquido / fator-inflacao - aplicado-real
    move 0 to anualizada
    if periodo = quantidade and liquido > 0
      perform anualizar
    end-if.
anualizar.
    move -0.999999 to limite-inferior
    move 1000 to limite-superior
    perform 48 times
      compute tentativa = (limite-inferior + limite-superior) / 2
      move 0 to valor-futuro
      perform varying lote from 1 by 1 until lote > total-fluxos
        compute valor-futuro = valor-futuro + valor-fluxo(lote) *
            (1 + tentativa) ** ((acumulado - dia-fluxo(lote)) / 365)
      end-perform
      if valor-futuro > liquido
        move tentativa to limite-superior
      else
        move tentativa to limite-inferior
      end-if
    end-perform
    compute anualizada = tentativa * 100.
antecipar-imposto.
    if regime = 3
      move ir-faixa(4) to taxa-come
    else
      move ir-faixa(2) to taxa-come
    end-if
    perform varying lote from 1 by 1 until lote > total-lotes
      compute ganho-come = saldo(lote) - base-come(lote)
      if ganho-come > 0
        compute idade = acumulado - nascimento(lote)
        move ganho-come to ganho
        call "tributacao" using ganho idade regime tabela-ir tabela-iof
            ir-fixo ir iof
        compute ir-come rounded = (ganho-come - iof) * taxa-come / 100
        subtract ir-come from saldo(lote)
        add ganho-come to lucro-realizado(lote)
        add ir-come to antecipado(lote) total-antecipado
        move saldo(lote) to base-come(lote)
      end-if
    end-perform.
imprimir.
    display data-ponto with no advancing
    move aplicado to ganho perform campo
    move bruto to ganho perform campo
    move liquido to ganho perform campo
    move total-ir to ganho perform campo
    move total-iof to ganho perform campo
    move custo-adm to ganho perform campo
    move custo-custodia to ganho perform campo
    move custo-corretagem to ganho perform campo
    move custo-outros to ganho perform campo
    move proventos to ganho perform campo
    move rent-bruta to ganho perform campo
    move rent-liquida to ganho perform campo
    move ganho-real to ganho perform campo
    if periodo = quantidade and liquido > 0
      move anualizada to ganho perform campo
    else
      display "|NA" with no advancing
    end-if
    display space.
campo.
    compute numero-saida rounded = ganho
    display "|" function trim(numero-saida) with no advancing.
falhar.
    display "Projecao fora dos limites do motor" upon stderr
    move 2 to return-code
    stop run.

ler-numero.
    accept linha
    if function test-numval(linha) not = 0 perform falhar end-if.


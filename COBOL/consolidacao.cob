>>source format free
identification division.
program-id. consolidacao.
data division.
working-storage section.
01 bruto-centavos pic s9(18)v99 comp-3.
01 adm-centavos pic s9(18)v99 comp-3.
01 custodia-centavos pic s9(18)v99 comp-3.
01 corretagem-centavos pic s9(18)v99 comp-3.
01 outros-centavos pic s9(18)v99 comp-3.
linkage section.
01 aplicado pic s9(18)v9(8) comp-3.
01 bruto pic s9(18)v9(8) comp-3.
01 ir pic s9(18)v9(8) comp-3.
01 iof pic s9(18)v9(8) comp-3.
01 administracao pic s9(18)v9(8) comp-3.
01 custodia pic s9(18)v9(8) comp-3.
01 corretagem pic s9(18)v9(8) comp-3.
01 outros pic s9(18)v9(8) comp-3.
01 liquido pic s9(18)v9(8) comp-3.
01 rentabilidade-bruta pic s9(18)v9(8) comp-3.
01 rentabilidade-liquida pic s9(18)v9(8) comp-3.
procedure division using aplicado bruto ir iof administracao custodia
    corretagem outros liquido rentabilidade-bruta rentabilidade-liquida.
    compute bruto-centavos rounded = bruto
    compute adm-centavos rounded = administracao
    compute custodia-centavos rounded = custodia
    compute corretagem-centavos rounded = corretagem
    compute outros-centavos rounded = outros
    compute liquido = bruto-centavos - ir - iof - adm-centavos -
        custodia-centavos - corretagem-centavos - outros-centavos
    compute rentabilidade-bruta = (bruto / aplicado - 1) * 100
    compute rentabilidade-liquida = (liquido / aplicado - 1) * 100
    goback.

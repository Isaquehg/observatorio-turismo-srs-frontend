# Observatório do Turismo · Santa Rita do Sapucaí

Frontend da plataforma de dados abertos do turismo de Santa Rita do Sapucaí (OT-SRS), feito a partir do design system **Observatório do Turismo SRS**.

## Rodando

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # gera dist/, pronto para qualquer hospedagem estática
```

O app usa `HashRouter`, então o `dist/` funciona em qualquer servidor estático (GitHub Pages, Netlify, servidor da Prefeitura) sem configurar rotas.

## O que tem

**Site público** — sem login
- `/` Início: hero, destaques do ano, públicos, relatórios recentes, convite aos estabelecimentos
- `/indicadores` Filtros por ano e setor, cartões, gráficos (linha, rosca, barras) e tabela; tudo exporta CSV
- `/relatorios` Busca, filtros, ordenação, destaque e resumo de cada relatório
- `/cadastur` Guia do Cadastur e da FNRH Digital com perguntas frequentes
- `/sobre` Como os dados são produzidos e contato

**Entrar** — `/entrar`, escolha de perfil (turista, comerciante, Prefeitura) com validação em português

**Área do comerciante** — `/comerciante`
- Prazo do mês, comparação com a cidade, últimos envios
- Envio mensal em 4 etapas, com cálculo automático da ocupação, rascunho e revisão
- Histórico com gráfico e correção de envios devolvidos
- Dados do estabelecimento

**Painel da Prefeitura** — `/prefeitura`
- Visão geral, publicação rápida de indicador e envio de planilha
- Validação de envios (aprovar, devolver com motivo, reabrir, lembrar quem não enviou)
- Inventário turístico com busca, filtros, cadastro e edição

O envio feito na área do comerciante aparece na fila de validação da Prefeitura (estado compartilhado em `contexto/Envios.jsx`, guardado no `localStorage`).

> Protótipo: login, dados e downloads de PDF são simulados. Qualquer senha com 6+ caracteres entra.

## Estrutura

```
src/
  estilos/       tokens.css (do design system), base, componentes, layout, gráficos
  componentes/   Topo, Rodape, LayoutPainel, Icone, Adesivo, Cartoes, Graficos, Basicos
  contexto/      Sessao, Envios, Avisos (toasts), Acessibilidade
  dados/         indicadores, relatórios e dados dos painéis (valores ilustrativos)
  paginas/       páginas públicas, comerciante/ e prefeitura/
  util/          formatação pt-BR, CSV, localStorage, hooks
public/          ilustrações e logos do design system
```

## Decisões

- **CSS próprio com os tokens do design system**, sem framework de UI. Tamanhos de texto em `rem` para o ajuste de fonte do menu de acessibilidade funcionar em todo o site.
- **Responsivo de 320px a telas largas**: navegação vira gaveta no celular, tabelas viram cartões, gráficos são desenhados na largura real do contêiner (o texto não encolhe), barras verticais deitam quando falta espaço.
- **Acessibilidade**: texto mínimo de 14px (corpo 18px), alvos de 48px, foco visível, erros escritos em palavras, `prefers-reduced-motion`, tabelas equivalentes aos gráficos para leitores de tela, navegação por setas nas abas e nos perfis.
- **Gráficos em SVG feitos à mão**, sem biblioteca: ficam no estilo do design system e o bundle continua pequeno (~95 KB gzip).

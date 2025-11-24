# Blackjack

Um jogo de Blackjack com análise estatística em tempo real, desenvolvido com Next.js e Phaser.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

-   [Node.js](https://nodejs.org/) (versão 18 ou superior)
-   [npm](https://www.npmjs.com/) (geralmente vem com o Node.js)

## 🚀 Como executar o projeto

### 1. Instalar dependências

Primeiro, instale todas as dependências do projeto:

```bash
npm install
```

Este comando irá instalar todas as dependências listadas no `package.json`, incluindo:

-   Next.js
-   React
-   Phaser
-   Recharts
-   Tailwind CSS
-   E outras dependências necessárias

### 2. Executar o servidor de desenvolvimento

Após instalar as dependências, execute o servidor de desenvolvimento:

```bash
npm run dev
```

O servidor será iniciado e você verá uma mensagem indicando que a aplicação está rodando em `http://localhost:3000`.

### 3. Acessar a aplicação

Abra seu navegador e acesse:

```
http://localhost:3000
```

A página será recarregada automaticamente sempre que você fizer alterações nos arquivos do projeto.

## 🛠️ Tecnologias utilizadas

-   **Next.js 16** - Framework React para produção
-   **React 19** - Biblioteca JavaScript para interfaces
-   **Phaser 3** - Framework de jogos 2D
-   **Recharts** - Biblioteca de gráficos para React
-   **Tailwind CSS** - Framework CSS utilitário
-   **TypeScript** - Superset do JavaScript com tipagem estática

## 📁 Estrutura do projeto

```
StatisticsGame/
├── app/                    # Páginas e rotas do Next.js
│   ├── game/              # Lógica do jogo Blackjack
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── stats/            # Componentes de estatísticas
│   └── ui/               # Componentes de interface
├── public/               # Arquivos estáticos
└── package.json          # Dependências do projeto
```

## 🎮 Funcionalidades

-   Jogo de Blackjack interativo
-   Análise estatística em tempo real
-   Gráficos de probabilidades e histórico
-   Painéis de estatísticas detalhadas

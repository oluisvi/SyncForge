# SyncForge — Discovery / Briefing Inicial

## 1. Visão do projeto

**SyncForge** é uma plataforma colaborativa para **visualização, exploração, documentação e planejamento de arquiteturas de software**.

A proposta é transformar sistemas que normalmente precisam ser compreendidos através de código, READMEs, diagramas estáticos e conhecimento espalhado pela equipe em uma **representação visual, navegável e colaborativa**.

O usuário poderá criar arquiteturas manualmente ou conectar um repositório para que o SyncForge analise sua estrutura e gere uma representação inicial do sistema.

Essa arquitetura poderá então ser:

- explorada visualmente;
- editada;
- comentada;
- compartilhada;
- discutida em tempo real;
- versionada;
- reproduzida historicamente;
- analisada por IA;
- relacionada ao código;
- utilizada para simular fluxos do sistema.

A ideia central é:

> **GitHub mostra o código. SyncForge mostra como o software funciona.**

---

## 2. Problema

Conforme sistemas crescem, entender sua arquitetura se torna cada vez mais difícil.

Informações importantes ficam espalhadas entre:

- código;
- READMEs;
- documentação;
- diagramas antigos;
- tickets;
- mensagens;
- pull requests;
- conhecimento individual dos desenvolvedores.

Um novo desenvolvedor frequentemente precisa descobrir sozinho:

```text
Onde começa uma requisição?

Qual serviço chama qual?

Quem acessa o banco?

Onde Redis entra?

Quais módulos dependem deste?

O que acontece se eu alterar esse serviço?

Por que essa arquitetura foi construída assim?
```

Mesmo quando existem diagramas, eles normalmente são **estáticos** e rapidamente ficam desatualizados.

Ferramentas tradicionais de whiteboard resolvem a parte visual, mas geralmente não possuem entendimento real sobre a codebase.

Ferramentas de análise de código entendem parte da codebase, mas normalmente não oferecem uma experiência visual colaborativa forte.

O SyncForge pretende conectar esses dois mundos.

---

## 3. Solução

O SyncForge cria um **canvas vivo da arquitetura do software**.

Exemplo:

```text
                    USER

                      │
                      ▼

                ┌───────────┐
                │  Next.js  │
                │ Frontend  │
                └─────┬─────┘
                      │ HTTP
                      ▼
                ┌───────────┐
                │  NestJS   │
                │    API    │
                └─────┬─────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼

      ┌─────────────┐    ┌───────────┐
      │ PostgreSQL  │    │   Redis   │
      └─────────────┘    └─────┬─────┘
                               │
                               ▼
                         ┌───────────┐
                         │  Worker   │
                         └───────────┘
```

Cada elemento deixa de ser apenas uma caixa desenhada.

Um node poderá conter contexto como:

- tecnologia;
- tipo;
- descrição;
- arquivos relacionados;
- dependências;
- endpoints;
- eventos;
- responsáveis;
- comentários;
- metadata.

O canvas passa a representar **informação estruturada sobre o sistema**.

---

## 4. Posicionamento

SyncForge não deve ser apresentado como:

> "Um clone do Miro para programadores."

Nem como:

> "ChatGPT que lê seu GitHub."

O posicionamento deve ser:

> **Collaborative Architecture Intelligence Platform**

Uma plataforma que conecta:

**Code Intelligence + Architecture Visualization + Realtime Collaboration + AI Assistance.**

---

## 5. Público-alvo

Inicialmente:

- desenvolvedores;
- estudantes de programação;
- tech leads;
- arquitetos de software;
- equipes de engenharia;
- startups;
- software houses;
- equipes responsáveis por sistemas complexos.

O produto deve ser útil tanto individualmente quanto em equipe.

---

## 6. Principais casos de uso

### Desenvolvedor entrando em um projeto

Conecta o repositório e explora visualmente sua arquitetura.

### Tech Lead

Documenta decisões e explica arquitetura para o time.

### Planejamento

A equipe desenha uma nova arquitetura colaborativamente antes da implementação.

### Code Review

Uma alteração pode ser analisada considerando seu impacto arquitetural.

### Onboarding

Novos desenvolvedores utilizam o mapa para entender rapidamente o sistema.

### Documentação

O diagrama funciona como documentação viva.

### Ensino

Professores e estudantes podem visualizar e simular arquiteturas.

---

## 7. Estrutura principal

```text
SyncForge

├── Organizations
├── Projects
├── Repositories
├── Architecture Canvas
├── Code Intelligence
├── Collaboration
├── Simulation
├── History
└── AI Assistant
```

---

## 8. Organizations

Equipes poderão possuir organizações.

Exemplo:

```text
Organization

ServAgency

Members
├── Luis
├── Ana
└── João

Projects
├── FlowDesk
├── Atlas
└── SHOP.CO
```

A arquitetura deverá permitir múltiplos usuários e múltiplas organizações.

---

## 9. Projects

Cada arquitetura será organizada dentro de um projeto.

Exemplo:

```text
Project

FlowDesk

Repository
github.com/.../FlowDesk

Architecture
System Architecture

Branch
main
```

Um projeto poderá possuir futuramente múltiplos canvases.

Exemplo:

```text
FlowDesk

├── System Architecture
├── Authentication Flow
├── Workflow Engine
├── Database Architecture
└── Deployment Architecture
```

---

## 10. Architecture Canvas

O coração visual do SyncForge será um canvas infinito.

O usuário poderá:

- criar nodes;
- mover nodes;
- conectar nodes;
- selecionar múltiplos elementos;
- criar grupos;
- navegar;
- aplicar zoom;
- comentar;
- editar propriedades;
- acompanhar outros usuários.

O canvas deve oferecer uma experiência extremamente fluida.

---

## 11. Nodes

Nodes representam componentes do sistema.

Tipos iniciais:

### Application

```text
Frontend
Backend
Mobile App
Desktop App
```

### Service

```text
API
Microservice
Worker
Background Job
```

### Data

```text
Database
Cache
Object Storage
Search Engine
Vector Database
```

### Messaging

```text
Queue
Event Bus
Message Broker
```

### Infrastructure

```text
CDN
Load Balancer
Gateway
Container
Serverless Function
```

### External

```text
Payment Provider
Authentication Provider
External API
Email Provider
```

### Generic

Node personalizado.

---

## 12. Edges

Conexões também possuem significado.

Exemplos:

```text
HTTP
REST
GraphQL
WebSocket
gRPC
SQL
Event
Queue
Pub/Sub
Webhook
File
Internal
```

Exemplo:

```text
Frontend
   │ REST
   ▼
API
   │ SQL
   ▼
PostgreSQL
```

As conexões deverão ser visualmente diferenciáveis sem comprometer acessibilidade.

---

## 13. Node Inspector

Ao selecionar um node:

```text
NestJS API

Type
Backend Service

Technology
NestJS

Repository
FlowDesk

Path
apps/api

Dependencies
PostgreSQL
Redis

Incoming
Next.js Web

Outgoing
PostgreSQL
Redis
Resend
```

O usuário poderá navegar da arquitetura para o código relacionado.

---

## 14. Realtime Collaboration

Um dos pilares principais será colaboração multiplayer.

Múltiplos usuários poderão abrir o mesmo canvas.

Exemplo:

```text
Luis ●
Ana  ●
João ●
```

Cada usuário terá:

- cursor;
- presença;
- seleção;
- identidade visual;
- estado online/offline.

Alterações serão sincronizadas em tempo real.

---

## 15. Multiplayer Presence

O usuário deverá conseguir enxergar:

```text
Ana is viewing PostgreSQL
Luis is editing API Gateway
João is typing a comment
```

Isso transforma o canvas em um espaço compartilhado.

---

## 16. Concurrent Editing

Dois usuários poderão alterar partes diferentes do sistema simultaneamente.

Exemplo:

```text
Luis
 ↓
API

       Ana
        ↓
      Redis
```

As alterações deverão convergir corretamente.

Não depender apenas de:

> "último usuário que salvou vence."

A arquitetura deverá considerar CRDT ou mecanismo equivalente.

---

## 17. CRDT

Uma opção inicial forte é utilizar **Yjs**.

O estado compartilhado poderá representar:

- nodes;
- edges;
- posições;
- propriedades;
- comentários;
- seleções relevantes.

O objetivo é permitir colaboração consistente mesmo com:

- latência;
- alterações simultâneas;
- reconexão;
- períodos temporariamente offline.

---

## 18. Connection Recovery

Quando a conexão cair:

```text
Connection lost

Reconnecting...
```

O usuário não deve perder imediatamente seu trabalho.

Quando a conexão retornar:

```text
Connected

Synchronizing changes...
```

O estado deverá convergir novamente.

---

## 19. Comments

Usuários poderão comentar diretamente sobre componentes.

Exemplo:

```text
PostgreSQL

Ana:
Precisamos manter esse banco separado?

Luis:
Por enquanto sim. O worker também depende dele.
```

Comentários poderão futuramente possuir:

- mentions;
- threads;
- resolved/unresolved.

---

## 20. Repository Connection

O usuário poderá conectar um repositório Git.

Inicialmente, foco em GitHub.

Fluxo:

```text
Connect Repository
        ↓
Select Repository
        ↓
Select Branch
        ↓
Analyze Codebase
        ↓
Generate Architecture
```

---

## 21. Code Analysis

O SyncForge deverá analisar a estrutura da codebase.

Possíveis informações:

- diretórios;
- módulos;
- imports;
- exports;
- dependencies;
- frameworks;
- endpoints;
- database models;
- environment boundaries;
- queues;
- workers;
- services.

O objetivo não é entender semanticamente 100% de qualquer linguagem no primeiro momento.

O MVP deverá começar com um escopo controlado.

---

## 22. Linguagens iniciais

Prioridade:

- TypeScript;
- JavaScript.

Especialmente:

- Next.js;
- React;
- Node.js;
- NestJS.

Posteriormente:

- Python;
- Java;
- C#;
- Go.

---

## 23. Static Analysis

A análise deverá priorizar mecanismos determinísticos antes da IA.

Possibilidades:

- AST;
- TypeScript Compiler API;
- Tree-sitter;
- import graph;
- package metadata;
- framework conventions.

A IA não deverá ser responsável por inventar a estrutura do projeto.

Regra:

> **Primeiro extrair fatos. Depois usar IA para interpretá-los.**

---

## 24. Architecture Generation

Após análise:

```text
Repository
      ↓
File Analysis
      ↓
Dependency Graph
      ↓
Component Detection
      ↓
Architecture Model
      ↓
Canvas
```

O usuário deverá poder revisar e corrigir o resultado.

O mapa gerado nunca deve ser tratado como verdade absoluta.

---

## 25. Code ↔ Architecture

Um grande diferencial será manter ligação entre arquitetura e código.

Exemplo:

```text
Workflow Engine
```

Node relacionado a:

```text
apps/api/src/workflows
apps/api/src/worker
```

Ao clicar:

```text
Related Files

workflow.service.ts
workflow-engine.ts
worker.processor.ts
```

---

## 26. Dependency Graph

Internamente o SyncForge poderá construir um grafo.

Exemplo:

```text
AuthController
      ↓
AuthService
      ↓
SessionService
      ↓
PrismaService
```

Isso permite responder perguntas arquiteturais sem depender exclusivamente de embeddings ou LLM.

---

## 27. Impact Analysis

O usuário seleciona:

```text
AuthService
```

E escolhe:

**Analyze Impact**

O sistema mostra:

```text
Direct dependents

AuthController
SessionService

Indirect dependents

UserModule
WorkspaceModule

Potential impact

Authentication
Sessions
Workspace access
```

---

## 28. Architecture Playback

Uma das funcionalidades visuais mais marcantes.

O SyncForge registra alterações relevantes.

Exemplo:

```text
10:31 Luis created API
10:33 Ana created Redis
10:34 Luis connected API → Redis
10:38 Ana added Worker
10:40 Worker → Redis
```

O usuário poderá pressionar:

```text
▶ PLAY
```

E assistir à arquitetura evoluindo.

---

## 29. Version History

O sistema deverá manter versões relevantes do canvas.

Exemplo:

```text
Today

14:20
Added Redis cache

13:52
Changed API connection

Yesterday

18:10
Added worker architecture
```

Deve ser possível visualizar estados anteriores.

Futuramente:

**Restore Version.**

---

## 30. System Simulation

Outra funcionalidade visual de grande impacto.

O usuário poderá simular um fluxo.

Exemplo:

### Simulate Request

```text
USER
 │
 ▼
FRONTEND
 │
 ▼
API
 │
 ├──────────→ REDIS
 │
 ▼
DATABASE
```

Durante a simulação, conexões e componentes envolvidos serão destacados progressivamente.

---

## 31. Simulation Steps

Exemplo:

```text
1. Browser sends GET /projects
2. Next.js calls API
3. API validates session
4. API queries Redis
5. Cache miss
6. API queries PostgreSQL
7. Response returned
8. Redis cache updated
```

O canvas deverá mostrar isso visualmente.

---

## 32. Failure Simulation

Posteriormente o usuário poderá selecionar um componente:

```text
Redis
```

E escolher:

```text
Simulate Failure
```

O componente passa para:

```text
REDIS
OFFLINE
```

Uma simulação poderá mostrar:

```text
API
 │
 ▼
Redis ✕
 │
 ▼
Fallback
 │
 ▼
PostgreSQL
```

Importante:

No MVP isso deverá ser uma **simulação declarativa**, e não execução real da infraestrutura.

---

## 33. Flow Definitions

Para permitir simulação confiável, o usuário poderá definir fluxos.

Exemplo:

```text
Flow

Get Projects

Steps

1. Frontend → API
2. API → Redis
3. Redis → API
4. API → PostgreSQL
5. PostgreSQL → API
6. API → Frontend
```

Assim o sistema não precisa inventar o comportamento.

---

## 34. AI Assistant

A IA será uma camada sobre informações estruturadas do sistema.

Exemplos:

> Explain this architecture.

> How does authentication work?

> What depends on Redis?

> What happens if the worker goes down?

> Explain this architecture to a junior developer.

---

## 35. Visual AI Responses

Um diferencial importante:

A IA não deve responder apenas em texto.

Exemplo:

Usuário:

> Show me the authentication flow.

SyncForge poderá:

1. responder;
2. selecionar os nodes relevantes;
3. esconder/diminuir elementos irrelevantes;
4. destacar o fluxo.

```text
Browser
   ↓
Next.js
   ↓
Auth API
   ↓
Session
   ↓
Database
```

A IA passa a controlar a **visualização**, não apenas produzir texto.

---

## 36. AI Architecture Review

Posteriormente:

> Review this architecture.

Possíveis resultados:

```text
3 observations

HIGH
Single database dependency.

MEDIUM
Worker and API share Redis.

INFO
Authentication boundary is centralized.
```

As observações devem deixar claro quando são:

- fatos detectados;
- inferências;
- recomendações.

---

## 37. AI Architecture Generation

Também será possível escrever:

> Create an architecture for a SaaS using Next.js, NestJS, PostgreSQL, Redis and background workers.

A IA gera uma proposta visual.

O usuário poderá então modificar o canvas.

Essa funcionalidade deve ser separada da análise de repositórios existentes para evitar confusão entre:

**arquitetura detectada**

e

**arquitetura sugerida.**

---

## 38. Search

Command Palette:

```text
⌘ K

Search architecture...

> Redis
> AuthService
> PostgreSQL
> workflow-engine.ts
```

A busca poderá encontrar:

- nodes;
- arquivos;
- serviços;
- comentários;
- pessoas;
- flows.

---

## 39. Focus Mode

Em arquiteturas grandes:

```text
Focus on

Authentication
```

O sistema reduz visualmente componentes irrelevantes.

Isso evita canvases gigantes e incompreensíveis.

---

## 40. Architecture Layers

O usuário poderá alternar entre perspectivas.

Exemplo:

```text
SYSTEM
MODULE
CODE
INFRASTRUCTURE
DATA
```

### System

Visão de alto nível.

### Module

Módulos internos.

### Code

Classes, arquivos e dependências.

### Infrastructure

Deploy e serviços.

### Data

Bancos e fluxos de dados.

Isso evita colocar tudo em um único diagrama impossível de ler.

---

## 41. Share

Projetos poderão possuir links compartilháveis.

Possíveis modos:

```text
Private
Organization
Public Read-only
```

Isso permitirá utilizar o SyncForge para documentação pública.

---

## 42. Export

Possíveis formatos:

- PNG;
- SVG;
- PDF;
- JSON;
- Mermaid.

Export para Mermaid é especialmente interessante para documentação técnica.

---

## 43. Dashboard

O dashboard inicial deve ser simples.

```text
Good evening, Luis.

Recent Projects

FlowDesk
Updated 2h ago

Atlas
Updated yesterday

SHOP.CO
Updated 3 days ago
```

Também:

```text
Recent activity

Repositories

Shared with me
```

O produto principal é o canvas.

O dashboard não deve roubar atenção.

---

## 44. Direção visual

O SyncForge deve ser visualmente excepcional.

Referências conceituais:

- Figma;
- Linear;
- Raycast;
- Vercel;
- Miro;
- tldraw;
- Excalidraw.

Mas sem copiar nenhuma delas.

A identidade deve transmitir:

**engineering + precision + collaboration + intelligence.**

---

## 45. Canvas Visual

A interface deverá utilizar:

- fundo neutro;
- grid extremamente sutil;
- cards bem definidos;
- edges elegantes;
- labels pequenas;
- zoom suave;
- sombras discretas;
- glass apenas quando funcional;
- microinterações;
- animações físicas suaves.

O sistema poderá oferecer dark/light mode.

---

## 46. Motion Language

Motion será parte importante da experiência.

Utilizar animação para:

- nodes aparecendo;
- edges conectando;
- usuários entrando;
- seleção;
- comentários;
- simulations;
- architecture playback;
- focus mode;
- transitions entre layers.

Evitar animação puramente decorativa.

Motion deve ajudar o usuário a entender:

> **o que mudou, onde mudou e como o sistema está se comportando.**

---

## 47. Performance

Performance é requisito fundamental.

Canvases poderão possuir centenas ou futuramente milhares de elementos.

Portanto:

- evitar rerender global;
- subscriptions granulares;
- memoização;
- viewport culling;
- lazy loading;
- progressive rendering;
- adaptive visual quality.

Efeitos premium nunca devem tornar o produto inutilizável em hardware modesto.

---

## 48. Responsividade

Desktop será a experiência principal.

Tablet:

- exploração;
- comentários;
- pequenas alterações.

Mobile:

- visualizar;
- navegar;
- comentar;
- acompanhar atividade.

Não tentar reproduzir toda a experiência de edição desktop em uma tela pequena.

---

## 49. Segurança

Como plataforma conectada a código-fonte, segurança será crítica.

Requisitos:

- tokens GitHub protegidos;
- menor escopo possível;
- criptografia de secrets;
- isolamento entre organizações;
- RBAC;
- proteção contra IDOR;
- audit logs;
- rate limiting;
- session security;
- sanitização;
- validação de uploads/imports;
- nenhum código do repository deve ser executado durante análise.

Regra:

> **Analyze code. Never execute repository code.**

---

## 50. Privacidade de código

O produto deverá deixar claro:

- quais arquivos são analisados;
- quais dados são armazenados;
- quais informações são enviadas para modelos de IA;
- como excluir um projeto;
- como revogar acesso ao GitHub.

Idealmente, fornecer controles para excluir:

```text
.env
secrets
generated files
vendor
node_modules
build artifacts
```

---

## 51. Stack sugerida

### Frontend

- Next.js;
- React;
- TypeScript;
- React Flow;
- Yjs;
- Zustand;
- TanStack Query;
- Tailwind CSS;
- shadcn/ui;
- Motion.

### Backend

- NestJS;
- TypeScript;
- PostgreSQL;
- Prisma;
- Redis;
- BullMQ;
- WebSockets.

### Code Intelligence

- TypeScript Compiler API;
- Tree-sitter;
- AST parsing;
- dependency graph.

### AI

- OpenAI API;
- embeddings quando justificáveis;
- structured outputs;
- retrieval sobre informações verificadas.

### Infra

- Docker;
- GitHub Actions;
- Vercel;
- Render/Fly.io ou equivalente;
- PostgreSQL gerenciado;
- Redis gerenciado.

---

## 52. Arquitetura conceitual

```text
                    BROWSER

                       │

             ┌─────────▼─────────┐
             │      Next.js      │
             │      Canvas       │
             └─────────┬─────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼

          REST API          Realtime
          NestJS            Gateway
              │                 │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              └────────┬────────┘
                       │
                       ▼
                    Redis
                       │
                       ▼
                     Queue
                       │
              ┌────────▼────────┐
              │ Analysis Worker │
              └────────┬────────┘
                       │
                ┌──────┴──────┐
                ▼             ▼

             GitHub          AI
```

---

## 53. MVP

O MVP precisa provar quatro pilares:

> **Visualização + Colaboração + Code Intelligence + Exploração**

### Authentication

- cadastro;
- login;
- logout;
- sessão.

### Organizations

- criar organização;
- membros;
- papéis básicos.

### Projects

- criar projeto;
- editar;
- excluir/arquivar.

### Canvas

- nodes;
- edges;
- drag-and-drop;
- zoom;
- pan;
- groups;
- inspector;
- save.

### Architecture Components

- frontend;
- backend;
- service;
- database;
- cache;
- queue;
- external service;
- generic.

### Collaboration

- realtime;
- presença;
- cursores;
- alterações simultâneas;
- reconnect.

### Comments

- comentários em nodes;
- threads básicas.

### GitHub

- conectar repositório;
- selecionar branch;
- analisar TypeScript/JavaScript.

### Code Intelligence

- estrutura;
- imports;
- módulos;
- dependency graph;
- tecnologias detectadas;
- arquivos relacionados.

### Architecture Generation

- gerar arquitetura inicial;
- revisar manualmente;
- editar resultado.

### Search

- nodes;
- componentes;
- arquivos.

### History

- alterações relevantes;
- snapshots básicos.

---

## 54. MVP+ — primeira expansão

Depois do MVP estável:

### Architecture Playback

Replay visual das alterações.

### System Flows

Criar fluxos manualmente.

### Simulation

Executar animações desses fluxos.

### Focus Mode

Isolar partes do sistema.

### Layers

System / Module / Code / Infrastructure / Data.

### AI Explain

Perguntas sobre arquitetura.

### Visual AI

IA destaca elementos do canvas.

---

## 55. V2 — Intelligence

Adicionar:

- impact analysis;
- AI architecture review;
- natural language → architecture;
- architectural insights;
- pull request analysis;
- architecture changes.

---

## 56. V3 — Git Intelligence

Exemplo:

```text
PR #81

Architecture Impact

+ BillingModule
+ Stripe integration
+ Webhook endpoint
+ 3 database entities

Affected

Orders
Users
Authentication

Risk

MEDIUM
```

O SyncForge começa a mostrar não apenas:

> Como o sistema é.

Mas:

> Como o sistema está mudando.

---

## 57. V4 — Advanced Collaboration

- branches de arquitetura;
- review;
- approval;
- mentions;
- architecture proposals;
- voting;
- decision records;
- presentation mode.

---

## 58. Architecture Decision Records

Uma evolução importante será integrar ADRs.

Exemplo:

```text
ADR-014

Use Redis for workflow queue

Status
Accepted

Reason

We need durable asynchronous processing.

Alternatives

Database polling
RabbitMQ
Kafka
```

O ADR poderá ser associado diretamente ao node Redis.

Assim o SyncForge explica não apenas:

> **o que existe**

mas também:

> **por que existe.**

---

## 59. O que NÃO entra inicialmente

Evitar no MVP:

- suporte universal a linguagens;
- execução de código;
- Kubernetes real;
- provisionamento de infraestrutura;
- deploy;
- CI/CD próprio;
- IDE completa;
- edição de arquivos;
- terminal;
- marketplace;
- billing;
- mobile editor completo;
- simulação automática perfeita;
- análise automática de qualquer arquitetura;
- agente de IA alterando código.

Esses elementos aumentariam brutalmente o escopo sem validar o conceito principal.

---

## 60. Diferencial técnico

O SyncForge permitirá demonstrar conhecimentos que normalmente não aparecem em um SaaS tradicional:

- realtime systems;
- WebSockets;
- distributed state;
- CRDT;
- concurrent editing;
- graph modeling;
- graph traversal;
- AST;
- static analysis;
- dependency analysis;
- background jobs;
- GitHub integration;
- visualization;
- performance em canvases complexos;
- IA grounded em dados estruturados;
- multi-user systems;
- security boundaries.

---

## 61. Diferencial visual

O projeto deverá possuir momentos de demonstração extremamente fortes.

### Momento 1

Dois browsers editando o mesmo canvas.

### Momento 2

Cursores se movimentando simultaneamente.

### Momento 3

GitHub repository → arquitetura aparecendo automaticamente.

### Momento 4

Usuário seleciona um componente e vê seus arquivos/dependências.

### Momento 5

Architecture Playback reproduz a evolução do sistema.

### Momento 6

Simulação anima uma requisição atravessando a arquitetura.

### Momento 7

Pergunta para IA:

> Show me how authentication works.

O restante do canvas escurece.

Os componentes de autenticação são destacados.

O fluxo é animado.

A explicação aparece ao lado.

Esse deverá ser um dos **signature moments** do produto.

---

## 62. Critério de sucesso

O SyncForge estará cumprindo sua proposta quando alguém puder conectar um projeto desconhecido e, em poucos minutos, sair de:

```text
"Eu tenho um repository enorme
e não sei como isso funciona."
```

para:

```text
"Agora eu consigo enxergar
como esse sistema está organizado."
```

E uma equipe puder sair de:

```text
"Deixa eu compartilhar minha tela
e explicar esse desenho."
```

para:

```text
"Entra no SyncForge.
Estamos todos olhando e editando
a mesma arquitetura."
```

---

## 63. Visão final

A evolução ideal é:

```text
V1
Collaborative Architecture Canvas

            ↓

V2
Repository → Architecture

            ↓

V3
Architecture Intelligence

            ↓

V4
Architecture Change Intelligence

            ↓

V5
Collaborative Software Architecture Platform
```

O objetivo final do SyncForge não é desenhar diagramas.

Também não é substituir GitHub ou uma IDE.

É criar uma **camada visual e colaborativa sobre sistemas de software** que permita às pessoas:

> **ver, explorar, entender, discutir e evoluir arquitetura juntas.**

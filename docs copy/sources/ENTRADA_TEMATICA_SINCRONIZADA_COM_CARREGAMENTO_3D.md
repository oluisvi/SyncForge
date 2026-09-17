# ENTRADA TEMÁTICA SINCRONIZADA COM CARREGAMENTO 3D

Trabalhe no repositório, branch e workspace atualmente abertos.

Não reinicie o projeto, não troque a stack e não substitua sistemas que já funcionam. Faça uma implementação incremental, integrada à arquitetura existente.

## OBJETIVO

Criar uma entrada temática curta, autoral e responsiva que funcione simultaneamente como:

1. introdução visual da marca;
2. tela de carregamento;
3. cobertura para a inicialização do WebGL/3D;
4. transição suave para o conteúdo principal.

O problema a resolver é:

> A animação não pode terminar enquanto o conteúdo pesado ainda está montando, compilando shaders ou renderizando os primeiros frames.

O 3D e a animação devem ser renderizados simultaneamente.

Enquanto a entrada estiver cobrindo a tela, o restante da aplicação deve:

- carregar os módulos;
- montar o canvas;
- criar a cena;
- compilar shaders;
- renderizar alguns frames;
- estabilizar a primeira composição.

Somente depois disso a animação poderá revelar o site.

## PRIMEIRO: INSPEÇÃO DIRECIONADA

Antes de modificar código:

1. Leia `AGENTS.md` e as instruções principais do projeto.
2. Identifique:
   - componente raiz da experiência;
   - componente do Canvas/WebGL;
   - fallback de carregamento;
   - sistema de reduced motion;
   - tokens visuais;
   - testes existentes;
   - mecanismo atual de primeira visita ou sessão.
3. Inspecione somente os arquivos necessários.

Não faça redesign geral ou auditoria desnecessária.

## DIREÇÃO CRIATIVA

A entrada deve nascer da identidade do projeto.

Não use uma vinheta corporativa genérica.

Escolha um elemento temático reconhecível da marca ou experiência, por exemplo:

- abertura de porta;
- acendimento de iluminação;
- cortina;
- obturador;
- espelho;
- íris;
- máscara;
- superfície material;
- transição arquitetônica.

A microcena deve durar aproximadamente entre 1,2 e 2 segundos depois que o conteúdo estiver pronto.

Antes da abertura, apresente uma tela de espera discreta e integrada à direção artística, contendo algo equivalente a:

“Preparando a entrada”

Não use spinner genérico se a identidade permitir uma solução mais autoral.

## ARQUITETURA OBRIGATÓRIA

Implemente estados explícitos, equivalentes a:

- `hidden`
- `waiting`
- `opening`

### Estado `waiting`

- Overlay cobrindo integralmente a viewport.
- Conteúdo principal e 3D renderizando atrás dele.
- Mensagem de preparação visível.
- Movimento leve e barato em CSS.
- Nenhuma abertura ainda.

### Sinal de prontidão do 3D

O componente do Canvas deve emitir um callback, como `onReady`, somente depois de:

1. a cena existir;
2. materiais e objetos estarem montados;
3. os shaders terem sido pré-compilados quando a API permitir;
4. pelo menos 2 ou 3 frames terem sido renderizados.

Em React Three Fiber, prefira algo equivalente a:

- `useThree` para acessar renderer, scene e camera;
- `gl.compile(scene, camera)` para aquecimento;
- `useFrame` para contar frames;
- callback idempotente para comunicar prontidão.

Não considere apenas o `onCreated` do Canvas como garantia de que a cena está visualmente estabilizada.

### Estado `opening`

Quando o Canvas estiver pronto:

1. aguarde um pequeno intervalo de estabilização, aproximadamente 200–350 ms;
2. inicie a animação de abertura;
3. revele progressivamente o conteúdo já renderizado;
4. remova o overlay após a animação.

### Timeout de segurança

Adicione um timeout máximo, aproximadamente entre 6 e 10 segundos.

Se a prontidão nunca for recebida:

- libere a entrada automaticamente;
- não mantenha o visitante preso;
- preserve o fallback existente.

O timeout é uma proteção, não o caminho principal.

## PRIMEIRA VISITA POR SESSÃO

A introdução deve aparecer apenas uma vez por sessão.

Use `sessionStorage` com uma chave versionada, por exemplo:

`project:thematic-entry-seen:v1`

Requisitos:

- não repetir durante navegação interna;
- não repetir em reloads da mesma sessão;
- permitir alteração da versão da chave quando uma nova entrada precisar ser testada;
- continuar funcionando caso o storage esteja indisponível.

Marque a entrada como vista quando a abertura realmente começar, não antes do carregamento terminar.

## ACESSIBILIDADE

- O overlay visual deve usar `aria-hidden="true"` se for puramente decorativo.
- Não criar elementos focáveis.
- Não prender o foco.
- Não bloquear conteúdo essencial para leitores de tela.
- Não depender da animação para acesso a links ou informações.
- Respeitar `prefers-reduced-motion`.

Com reduced motion:

- não executar a microcena;
- liberar o conteúdo imediatamente;
- manter a aplicação funcional;
- registrar a sessão normalmente.

## RESPONSIVIDADE

Não apenas reduza a versão desktop.

Crie uma composição apropriada para mobile.

Exemplo:

Desktop:

- abertura lateral;
- painéis movendo-se para esquerda e direita.

Mobile:

- abertura vertical;
- painéis movendo-se para cima e para baixo.

Valide:

- desktop;
- tablet;
- mobile;
- small mobile;
- orientação vertical;
- safe areas;
- textos sem clipping.

## PERFORMANCE

Priorize:

- CSS transforms;
- opacity;
- `translate3d`;
- poucas camadas;
- ausência de vídeo;
- ausência de imagens pesadas;
- ausência de postprocessing desnecessário;
- `will-change` somente nos elementos animados.

Não esconda o Canvas com `display: none`.

O Canvas precisa continuar renderizando atrás do overlay para que o aquecimento seja real.

Evite:

- filtros caros;
- blur exagerado;
- dezenas de elementos animados;
- loops JavaScript para animação visual;
- progressos falsos baseados apenas em porcentagem arbitrária.

## FALLBACK

Se WebGL não estiver disponível:

- preserve o fallback existente;
- permita que a entrada seja concluída rapidamente;
- não espere pelo callback do Canvas;
- não impeça o acesso à versão sem 3D.

## TESTES

Implemente teste de regressão antes da mudança.

Verifique automaticamente:

1. existência dos estados `waiting` e `opening`;
2. Canvas comunicando prontidão;
3. pré-compilação da cena;
4. espera por múltiplos frames;
5. timeout máximo;
6. primeira visita por sessão;
7. reduced motion;
8. versão mobile;
9. remoção segura do overlay;
10. integração sem alterar navegação, câmera ou scroll.

Depois rode:

- teste focado da entrada;
- suíte completa relevante;
- typecheck;
- build de produção.

## QA VISUAL

Faça inspeção em navegador real.

Teste:

1. primeira visita com cache frio;
2. reload na mesma sessão;
3. nova sessão;
4. dispositivo lento;
5. desktop;
6. mobile;
7. reduced motion;
8. ausência de WebGL;
9. abertura após a cena estar estabilizada;
10. inexistência de travada visível logo após a revelação.

Meça ou registre os momentos de:

- overlay em `waiting`;
- recebimento de `ready`;
- início de `opening`;
- remoção final.

## NÃO FAZER

Não:

- abrir a entrada imediatamente no primeiro `useEffect`;
- usar apenas um timer fixo como indicador de prontidão;
- aguardar todos os recursos indefinidamente;
- bloquear o site se o Canvas falhar;
- repetir a animação em navegação interna;
- introduzir joystick ou controles não solicitados;
- alterar câmera, scroll ou arquitetura de estado sem necessidade;
- instalar dependências para algo realizável com APIs existentes;
- fazer redesign geral;
- enviar arquivos gerados de build ou screenshots de QA.

## RESULTADO ESPERADO

O visitante deve perceber:

1. uma entrada autoral;
2. uma curta preparação;
3. uma abertura fluida;
4. o conteúdo principal já renderizado;
5. nenhuma travada forte imediatamente depois da revelação.

A animação deve funcionar como parte real da estratégia de carregamento, e não como uma camada decorativa desconectada.

## RELATÓRIO FINAL

Informe objetivamente:

### Changed

- componentes alterados;
- estados e handshake implementados;
- comportamento desktop/mobile.

### Preserved

- navegação;
- scroll;
- câmera;
- fallback;
- conteúdo;
- conversão.

### Verified

- testes;
- typecheck;
- build;
- desktop/mobile;
- reduced motion;
- primeira visita por sessão;
- timeout de segurança.

### Remaining

Somente limitações reais dependentes de assets, infraestrutura ou dispositivos externos.

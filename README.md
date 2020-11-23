# Jogo da Velha

Jogo da velha criado para a disciplina de Tópicos Especiais I

# Resumo do Projeto

Este trabalho consiste em criar uma aplicação que permite que usuários joguem o Jogo da Velha através de um servidor de websockets.

Neste projeto foi implementado um sistema que irá armazenar o nome e o WS(websocket) de quem se conectar ao servidor.
Após conectado o usuário será movido à uma área que contém um chat entre todos os jogadores conectados, uma área para visualizar as salas de jogos criadas, uma lista de jogadores onlines juntamente com o número de jogadores online.

O jogador conectado poderá criar uma sala, tanto com senha quanto sem, que irá aparecer para todos os demais jogadores, foi definido um limite de 20 salas, disponibilizando que qualquer outro usuário que queira jogar entre na sala.
Dentro desta sala criada haverá também um chat, mas desta vez será somente entre os jogadores que estarão dentro desta sala.
Quando uma sala tiver dois jogadores (o número máximo suportado por cada sala), então qualquer jogador pode iniciar a partida.

Quando a partida se inicia, o próprio servidor irá decidir quem que será o "X" e quem será a "O" aleatóriamente, o "X" sempre iniciará como regra do projeto.
Depois de iniciada a partida, cada jogador visualizará quem será qual símbolo.
Durante a partida o jogador pode desistir da partida a qualquer momento, fazendo com que o adversário ganhe e o desistente saia da sala imediatamente.

# Execução do Projeto

Primeiro, execute o código do arquivo "servidor.js" em seu computador para abrir o servidor de websockets.
Com o servidor aberto, basta acessar a url "http://localhost:3000/" .

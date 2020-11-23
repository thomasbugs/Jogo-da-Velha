const WebSocket = require('ws');
const express = require('express');

const wss = new WebSocket.Server({ port: 8080 },function (){
	console.log('rodando');
});

wss.setMaxListeners(0)

var app = express();

app.use(express.static(__dirname + '/public'));
app.get(/^(.+)$/, function(req, res) {
    try {
        res.write("A pagina que vc busca nao existe")
        res.end();
    } catch (e) {
        res.end();
    }
})
app.listen(3000, function() {
    console.log("servidor no ar");
});

var vetor_conexoesEfetivas=[];  // UserNome: Nome do Usuario
                                // UserWS: Socket do Usuario, 
                                // UserSala: Sala em que o usuário está (-1 se não estiver em nenhuma)

var vetor_conexoesAguardo=[];   // Apenas um vetor com os usuarios que não estão "logados"


var vetor_salas=[]              // Nome: Nome da sala
                                // Senha: Senha da sala
                                // NumeroDentro: Quantidade de usuarios na sala 
                                // WsUsuarios: Vetor com os sockets dos usuarios

var vetor_partidas=[]           // SalaPartida: Id da sala da partida 
                                // X: Id no vetor WsUsuarios do vetor_salas de quem joga com o X
                                // O: Id no vetor WsUsuarios do vetor_salas de quem joga com o O
                                // Tabuleiro: Tabuleiro ['','','']
                                //                      ['','','']
                                //                      ['','','']
                                // Vez: Vez de quem joga (Inicia pelo X)

setInterval (intervalo, 1000);

setInterval (intervalo2, 1000);

wss.on('connection', function connection(ws) {

    ws.setMaxListeners(0)

  console.log("Cliente se conectou");

  vetor_conexoesAguardo.push(ws)

  ws.on('message', function incoming(message) {

    var msg = JSON.parse(message)

    switch (msg.tipo){

        case 'NOME':
            for(var i=0; i < vetor_conexoesEfetivas.length; i++){
                if(msg.NOME == vetor_conexoesEfetivas[i].UserNome){
                    ws.send(JSON.stringify({tipo:'ErroNome'}))
                    return;
                }
            }
            
            ws.send(JSON.stringify({tipo: 'NomeConfirmado', NOME: msg.NOME}))
            break;

        case 'SALVARUSUARIO':

            vetor_conexoesEfetivas.push({UserNome: msg.NOME, UserWS: ws, UserSala: -1})

            for(var a = 0 ; a < vetor_salas.length ; a++){
                if(vetor_salas[a].NumeroDentro > 0){

                    ws.send(JSON.stringify({tipo: 'AtualizaSalas', como: 'show', salaId: a}))

                }
            }

            break;

        case 'DESCONECTOU':
            for( var i in vetor_conexoesEfetivas){
                if(vetor_conexoesEfetivas[i].UserWS == ws){
                    vetor_conexoesEfetivas.splice(i,1)
                    return;
                }
            }

            console.log('Usuario não encontrado')

            break;

        case 'MENSAGEMLOBBY':

            for (var a=0 ; a < vetor_conexoesEfetivas.length ; a++){

                vetor_conexoesEfetivas[a].UserWS.send(JSON.stringify({  tipo: 'MensagemLobby', 
                                                                        Origem:msg.Origem, 
                                                                        Mensagem: msg.Mensagem}));
           
            }
            break;

        case 'MENSAGEMSALA':

            switch(msg.tipo2){

                case 'ENTRADA':

                    for (var a=0 ; a < vetor_salas[msg.salaId].WsUsuarios.length ; a++){
        
                        vetor_salas[msg.salaId].WsUsuarios[a].send(JSON.stringify({ tipo: 'MensagemSala',
                                                                                    Origem:msg.Origem,
                                                                                    Acao: 'Entrou'}));
                   
                    }

                    break;

                case 'SAIDA':

                    for (var a=0 ; a < vetor_salas[msg.salaId].WsUsuarios.length ; a++){
        
                        vetor_salas[msg.salaId].WsUsuarios[a].send(JSON.stringify({ tipo: 'MensagemSala',
                                                                                    Origem:msg.Origem,
                                                                                    Acao: 'Saiu'}));
                    
                    }

                    break;

                case 'MENSAGEM':

                    for (var a=0 ; a < vetor_salas[msg.salaId].WsUsuarios.length ; a++){
        
                        vetor_salas[msg.salaId].WsUsuarios[a].send(JSON.stringify({ tipo: 'MensagemSala', 
                                                                                    Origem:msg.Origem, 
                                                                                    Mensagem: msg.Mensagem}));
                
                    }

                    break;

            }

            break;

        case 'CRIARSALA':

            var NumeroDeSalas = vetor_salas.length
            var IdNovaSala = undefined

            for(var i = 0 ; i < NumeroDeSalas ; i++){
                
                if(vetor_salas[i].NumeroDentro == 0){

                    IdNovaSala = i
                    break

                }

            }

            if((NumeroDeSalas >= 20) && !(IdNovaSala)){
                ws.send(JSON.stringify({tipo: 'ErroCriarSala'}))
                break;
            }

            if(IdNovaSala != undefined){

                var WsUsuarios=[]
                WsUsuarios.push(ws)
                var SalaAux = {Nome: 'Sala de '+ msg.nomeCriador, Senha: msg.salaSenha, NumeroDentro: 1, WsUsuarios: WsUsuarios}
                vetor_salas[IdNovaSala] = SalaAux

                ws.send(JSON.stringify({tipo: 'SalaCriada', salaId: IdNovaSala, nomeSala: SalaAux.Nome}))

                for(var i in vetor_conexoesEfetivas){

                    vetor_conexoesEfetivas[i].UserWS.send(JSON.stringify({tipo: 'AtualizaSalas', como: 'create', salaId: IdNovaSala, salaNome: SalaAux.Nome}))

                }

                for( var i in vetor_conexoesEfetivas){
                    if(vetor_conexoesEfetivas[i].UserWS == ws){
                        vetor_conexoesEfetivas[i].UserSala = IdNovaSala
                        break;
                    }
                }

            }
            else{

                var WsUsuarios=[]
                WsUsuarios.push(ws)
                var SalaAux = {Nome: 'Sala de '+ msg.nomeCriador, Senha: msg.salaSenha, NumeroDentro: 1, WsUsuarios: WsUsuarios}
                vetor_salas.push(SalaAux)
                IdNovaSala = vetor_salas.length-1

                ws.send(JSON.stringify({tipo: 'SalaCriada', salaId: IdNovaSala, nomeSala: SalaAux.Nome}))

                for(var i in vetor_conexoesEfetivas){

                    vetor_conexoesEfetivas[i].UserWS.send(JSON.stringify({tipo: 'AtualizaSalas', como: 'create', salaId: IdNovaSala, salaNome: SalaAux.Nome}))

                }

                for( var i in vetor_conexoesEfetivas){
                    if(vetor_conexoesEfetivas[i].UserWS == ws){
                        vetor_conexoesEfetivas[i].UserSala = IdNovaSala
                        break;
                    }
                }

            }

            break;

        case 'ENTRARSALA':

            if(msg.Pass){

                if(msg.Pass == vetor_salas[msg.salaId].Senha){
                    ws.send(JSON.stringify({tipo: 'SalaCriada', salaId: msg.salaId, nomeSala: vetor_salas[msg.salaId].Nome}))
                    vetor_salas[msg.salaId].NumeroDentro += 1
                    vetor_salas[msg.salaId].WsUsuarios.push(ws)
        
                    for(var i = 0 ; i < vetor_conexoesEfetivas.length ; i++){
        
                        if(vetor_conexoesEfetivas[i].UserWS == ws){
        
                            vetor_conexoesEfetivas[i].UserSala = msg.salaId
                            break;
        
                        }
                    }
                }
                else{

                    ws.send(JSON.stringify({tipo: 'ErroEntrarSala', tipoErro: 'SenhaIncorreta'}))

                }

                break;

            }

            if(vetor_salas[msg.salaId].NumeroDentro >= 2){
                ws.send(JSON.stringify({tipo: 'ErroEntrarSala', tipoErro: 'SalaCheia'}))
                break;
            }

            if(vetor_salas[msg.salaId].Senha != ''){

                ws.send(JSON.stringify({tipo: 'PedirSenha', salaId: msg.salaId}))

            }else{

                ws.send(JSON.stringify({tipo: 'SalaCriada', salaId: msg.salaId, nomeSala: vetor_salas[msg.salaId].Nome}))
                vetor_salas[msg.salaId].NumeroDentro += 1
                vetor_salas[msg.salaId].WsUsuarios.push(ws)
    
                for(var i = 0 ; i < vetor_conexoesEfetivas.length ; i++){
    
                    if(vetor_conexoesEfetivas[i].UserWS == ws){
    
                        vetor_conexoesEfetivas[i].UserSala = msg.salaId
                        break;
    
                    }
    
                }

            }


            break;

        case 'SAIUSALA':

            vetor_salas[msg.salaId].NumeroDentro -= 1

            if(vetor_salas[msg.salaId].NumeroDentro < 1){

                for(var i in vetor_conexoesEfetivas){

                    vetor_conexoesEfetivas[i].UserWS.send(JSON.stringify({tipo: 'AtualizaSalas',como: 'erase', salaId: msg.salaId}))
    
                }

                vetor_salas[msg.salaId].WsUsuarios = []

            }
            else{

                var remover = vetor_salas[msg.salaId].WsUsuarios.indexOf(ws)

                vetor_salas[msg.salaId].WsUsuarios.splice(remover,1)
            
            }

            break;

        case 'PARTIDAINICIADA':

            if(vetor_salas[msg.salaId].NumeroDentro < 2){

                ws.send(JSON.stringify({tipo: 'ErroIniciarPartida'}))
                break;

            }
            else{

                var partidaAux=[]
                var Tabuleiro=[ ['','',''],
                                ['','',''],
                                ['','',''] ]
                
                var ordem = getRandom()

                partidaAux =    {   SalaPartida: msg.salaId, 
                                    X: ordem, 
                                    O: (ordem-1)*(-1), 
                                    Tabuleiro: Tabuleiro,
                                    Vez: ordem}

                vetor_partidas.push(partidaAux)
                
                var nomesAux=[]
                
                for(var i = 0 ; i < vetor_conexoesEfetivas.length ; i++){

                    for(var a = 0 ; a < vetor_salas[msg.salaId].WsUsuarios.length ; a++){

                        if(vetor_conexoesEfetivas[i].UserWS == vetor_salas[msg.salaId].WsUsuarios[a]){
                            
                            nomesAux.push(vetor_conexoesEfetivas[i].UserNome)

                        }

                    }

                }

                vetor_salas[msg.salaId].WsUsuarios[0].send(JSON.stringify({ tipo: 'PartidaIniciada',
                                                                            Jogadores: nomesAux,
                                                                            Vez:(vetor_salas[msg.salaId].WsUsuarios[0] == vetor_salas[msg.salaId].WsUsuarios[ordem])}))
                vetor_salas[msg.salaId].WsUsuarios[1].send(JSON.stringify({ tipo: 'PartidaIniciada',
                                                                            Jogadores: nomesAux,
                                                                            Vez:(vetor_salas[msg.salaId].WsUsuarios[1] == vetor_salas[msg.salaId].WsUsuarios[ordem])}))

            }


            break;

        case 'DESISTENCIA':

            for(var i in vetor_partidas){

                if(vetor_partidas[i].SalaPartida == msg.salaId){

                    if(vetor_salas[i].WsUsuarios[0] == ws){
                        vetor_salas[i].WsUsuarios[1].send(JSON.stringify({tipo: 'Vitoria', tipo2: 'Desistencia', Desistente: msg.Usuario}))
                        vetor_salas[msg.salaId].WsUsuarios[1].send(JSON.stringify({ tipo: 'MensagemSala',
                                                                                    Origem:msg.Usuario,
                                                                                    Acao: 'Saiu'}));
                    }
                    else{
                        vetor_salas[i].WsUsuarios[0].send(JSON.stringify({tipo: 'Vitoria', tipo2: 'Desistencia', Desistente: msg.Usuario}))
                        vetor_salas[msg.salaId].WsUsuarios[0].send(JSON.stringify({ tipo: 'MensagemSala',
                                                                                    Origem:msg.Usuario,
                                                                                    Acao: 'Saiu'}));
                    }

                    

                    var RemoveAux = vetor_salas[msg.salaId].WsUsuarios.indexOf(ws)

                    vetor_salas[msg.salaId].WsUsuarios.splice(RemoveAux,1)
                    vetor_salas[msg.salaId].NumeroDentro -= 1

                    break;

                }

            }

            break;

        case 'JOGADA':

            var idPartida
            var VezJogada
            var Simbolo

            for(var i = 0 ; i < vetor_partidas.length ; i++){

                if(vetor_partidas[i].SalaPartida == msg.salaId){

                    idPartida = i
                    VezJogada = vetor_partidas[i].Vez
                    
                    if(vetor_partidas[i].Vez == vetor_partidas[i].X){

                        Simbolo = 'X'

                    }
                    else{

                        Simbolo = 'O'

                    }

                    break;

                }

            }

            if(ws == vetor_salas[msg.salaId].WsUsuarios[VezJogada]){

                var TabAux = vetor_partidas[idPartida].Tabuleiro
                var y = msg.Coordenadas[0]
                var x = msg.Coordenadas[1]

                if(TabAux[y][x] == ''){

                    TabAux[y][x] = Simbolo
                    
                    for(var k = 0 ; k < vetor_salas[msg.salaId].WsUsuarios.length ; k++){

                        vetor_salas[msg.salaId].WsUsuarios[k].send(JSON.stringify({ tipo: 'AtualizaCampo', 
                                                                                Simbolo: Simbolo, 
                                                                                Coordenadas: msg.Coordenadas}))

                    }

                    var Result = VerificaVitoria(vetor_partidas[idPartida], Simbolo)
                    if(Result[0] == 'Vitoria'){

                        ws.send(JSON.stringify({tipo: 'Vitoria', CoordenadasVitoria: Result[1], tipo2: 'Normal'}))
                        vetor_salas[msg.salaId].WsUsuarios[(VezJogada-1)*(-1)].send(JSON.stringify({tipo: 'Derrota', 
                                                                                                    CoordenadasDerrota: Result[1]}))

                        vetor_partidas.splice(idPartida,1)

                    }
                    else if(Result[0] == 'Indeterminado'){
                        vetor_partidas[idPartida].Vez = (VezJogada-1)*(-1)

                    }
                    else if(Result[0] == 'Velha'){

                        ws.send(JSON.stringify({tipo: 'Velha'}))
                        vetor_salas[msg.salaId].WsUsuarios[(VezJogada-1)*(-1)].send(JSON.stringify({tipo: 'Velha'}))

                        vetor_partidas.splice(idPartida,1)

                    }
                    

                }
                else{

                    ws.send(JSON.stringify({tipo: 'ErroJogada', tipo2: 'Movimento'}))
                    return;

                }

            }
            else{

                ws.send(JSON.stringify({tipo: 'ErroJogada', tipo2: 'VezAdversario'}))
                return;

            }
        
        
            break;
        
        case 'PARTIDAFINALIZADA':

            for(var i in vetor_partidas){

                if(vetor_partidas[i].SalaPartida == msg.salaId){

                    vetor_partidas.splice(i,1)

                    break;

                }

            }    

            break;


    }

    ws.on('close', function fecho(evt){
        var id
        var a = vetor_conexoesAguardo.indexOf(ws)
        vetor_conexoesAguardo.splice(a,1)
        for(var i in vetor_conexoesEfetivas){
            if(vetor_conexoesEfetivas[i].UserWS == ws){
                id = vetor_conexoesEfetivas[i].UserSala
                if(id > -1){

                    var remover = vetor_salas[id].WsUsuarios.indexOf(ws)
                    vetor_salas[id].WsUsuarios.splice(remover,1)
                    vetor_salas[id].NumeroDentro -= 1

                    for(var k = 0 ; k < vetor_salas[id].WsUsuarios.length ; k++){

                        vetor_salas[id].WsUsuarios[k].send(JSON.stringify({ tipo: 'MensagemSala',
                                                                            Origem: vetor_conexoesEfetivas[i].UserNome,
                                                                            Acao: 'Saiu'}))
                    }
                }
                vetor_conexoesEfetivas.splice(i,1)
                break;
            }
        }
        if(id > -1){

            if(vetor_salas[id].NumeroDentro < 1){

                for( var i in vetor_conexoesEfetivas){
                    
                    vetor_conexoesEfetivas[i].UserWS.send(JSON.stringify({tipo: 'AtualizaSalas',como: 'erase', salaId: id}))
                
                }
            
            }
            
        }
    })

    
  });

});

function getRandom() {
    return Math.round(Math.random());
}

function VerificaVitoria(Partida, Simbolo){

    var CondVitoriaHori = 0
    var CoordHori=[]
    var CondVitoriaVert = 0
    var CoordVert=[]
    var CondVitoriaDiag1 = 0
    var CoordDiag1=[]
    var CondVitoriaDiag2 = 0
    var CoordDiag2=[]
    var CondVelha = 9

    var TabAux = Partida.Tabuleiro

    for(var y = 0 ; y < TabAux.length ; y++){
        for(var x = 0 ; x < TabAux[y].length ; x++){

            if(TabAux[y][x] != ''){

                CondVelha -= 1

            }
            if(TabAux[y][x] == Simbolo){

                CondVitoriaHori += 1
                CoordHori.push([y,x])

            }
            if(TabAux[x][y] == Simbolo){

                CondVitoriaVert += 1
                CoordVert.push([x,y])

            }
            
        }

        if(CondVitoriaVert == 3){

            return ['Vitoria',CoordVert];

        }
        if(CondVitoriaHori == 3){

            return ['Vitoria',CoordHori];

        }

        if(TabAux[y][y] == Simbolo){

            CondVitoriaDiag1 += 1
            CoordDiag1.push([y,y])

        }
        if(TabAux[y][TabAux.length - y - 1] == Simbolo){

            CondVitoriaDiag2 += 1
            CoordDiag2.push([y,TabAux.length - y - 1])

        }

        CondVitoriaHori = 0
        CondVitoriaVert = 0
        CoordHori=[]
        CoordVert=[]
    }

    if(CondVitoriaDiag1 == 3){

        return ['Vitoria',CoordDiag1];

    }
    if(CondVitoriaDiag2 == 3){

        return ['Vitoria',CoordDiag2];

    }
    if(CondVelha == 0){

        return ['Velha']

    }

    return ['Indeterminado'];

}

function intervalo(){

    var NomesUsuarios=[]

    for(var i in vetor_conexoesAguardo){
        vetor_conexoesAguardo[i].send(JSON.stringify({tipo: 'NumeroOnline', NumeroOnline: vetor_conexoesEfetivas.length}))
    }
    for(var i = 0 ; i < vetor_conexoesEfetivas.length ; i++){

        NomesUsuarios.push(vetor_conexoesEfetivas[i].UserNome)

    }
    for(var i in vetor_conexoesEfetivas){
        vetor_conexoesEfetivas[i].UserWS.send(JSON.stringify({tipo: 'NumeroOnline', NumeroOnline: vetor_conexoesEfetivas.length}))
        vetor_conexoesEfetivas[i].UserWS.send(JSON.stringify({tipo: 'ListaOnline', NomesUsuariosOnline: NomesUsuarios}))
        for(var a = 0 ; a < vetor_salas.length ; a++){
            vetor_conexoesEfetivas[i].UserWS.send(JSON.stringify({  tipo: 'AtualizaSalas', 
                                                                    como: 'update',
                                                                    salaNome: vetor_salas[a].Nome , 
                                                                    salaId: a,
                                                                    NumeroDentro: vetor_salas[a].NumeroDentro})) 
        }
    }
}

function intervalo2(){

    var NomesUsuarios=[]

    for(var i = 0 ; i < vetor_salas.length ; i++){

        for(var a = 0 ; a < vetor_salas[i].WsUsuarios.length ; a++){

            for(var k = 0 ; k < vetor_conexoesEfetivas.length ; k++){

                if(vetor_conexoesEfetivas[k].UserWS == vetor_salas[i].WsUsuarios[a]){

                    NomesUsuarios.push(vetor_conexoesEfetivas[k].UserNome)

                }

            }

        }

        for(var a = 0 ; a < vetor_salas[i].WsUsuarios.length ; a++){

            vetor_salas[i].WsUsuarios[a].send(JSON.stringify({tipo: 'ListaUsuariosSala', NomesUsuariosSala: NomesUsuarios}))
    
        }
        
        NomesUsuarios=[]

    }

}
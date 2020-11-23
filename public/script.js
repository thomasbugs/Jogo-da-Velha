var servidorWebserver= 'ws://localhost:8080'

var websocket

var nomeUser            // Nome do usuario
var salaId              // Sala em que o usuário está (-1 se não estiver em uma sala)

function startConnection () {
    websocket = new ReconnectingWebSocket(servidorWebserver)
    websocket.onopen = function (evt) { onOpen(evt) }
    websocket.onclose = function (evt) { onClose(evt) }
    websocket.onmessage = function (evt) { onMessage(evt) }
    websocket.onerror = function (evt) { onError(evt) }
}

function onOpen (evt) {

    document.getElementById('login').style.display = 'block'
    document.getElementById('lobby').style.display = 'none'
    document.getElementById('sala').style.display = 'none'
    document.getElementById('jogo').style.display = 'none'

    ResetaTabuleiro();

}
function onClose (evt) {


}

function onMessage (evt) {
    var MsgServer = JSON.parse(evt.data)
    
    switch (MsgServer.tipo){
        case 'ErroNome':
            alert('Nome de Usuario ja existe!')
            break;
        
        case 'ErroCriarSala':
            alert('Já há muitas salas criadas, entre em uma ou espere liberar vaga! (MAX: 20)')
            break;

        case 'ErroEntrarSala':
            
            switch(MsgServer.tipoErro){

                case 'SalaCheia':

                    alert('A sala que você tentou entrar está cheia!')

                    break;

                case 'SenhaIncorreta':

                    alert('Senha Incorreta!')

                    break;


            }

            break;        
        
        case 'ErroIniciarPartida':

            alert('Não há pessoas o suficiente para iniciar a partida!')

            break;
        
        case 'ErroJogada':

            switch(MsgServer.tipo2){

                case 'VezAdversario':

                    alert('Não é a sua vez de jogar!')

                    break;
                
                case 'Movimento':

                    alert('Movimento Inválido, casa já preenchida!')

                    break;

            }

            break;

        case 'NomeConfirmado':
            websocket.send(JSON.stringify({tipo: 'SALVARUSUARIO', NOME: MsgServer.NOME}))
            document.getElementById('login').style.display = 'none'
            document.getElementById('lobby').style.display = 'block'
            document.getElementById('sala').style.display = 'none'
            document.getElementById('jogo').style.display = 'none'
            websocket.send(JSON.stringify({tipo: ''}))
            break;

        case 'NumeroOnline':
            document.getElementById('Onlines').innerHTML = 'No momento há '+ MsgServer.NumeroOnline+' pessoas online!'
            document.getElementById('UsuariosOnline').innerHTML = 'Usuários Online: '+ MsgServer.NumeroOnline
            
            break;

        case 'AtualizaSalas':

            switch(MsgServer.como){
                case 'show':

                    document.getElementById('sala'+(MsgServer.salaId+1)).style.display = 'block'
                
                    break;
                
                case 'create':

                    document.getElementById('botaoSala'+(MsgServer.salaId+1)).innerHTML = MsgServer.salaNome + ' 1/2'
                    document.getElementById('sala'+(MsgServer.salaId+1)).style.display = 'block'

                    break;
                
                case 'erase':

                    document.getElementById('sala'+(MsgServer.salaId+1)).style.display = 'none'

                    break;

                case 'update':

                    document.getElementById('botaoSala'+(MsgServer.salaId+1)).innerHTML = MsgServer.salaNome + ' ' + MsgServer.NumeroDentro + '/2'

                    break;
            }
            break;
            
        case 'MensagemLobby':
            
            document.getElementById('CorpoChatLobby').innerHTML += '<br>'+MsgServer.Origem+': '+MsgServer.Mensagem
            document.getElementById('CorpoChatLobby').scrollTo(0, document.getElementById('CorpoChatLobby').scrollHeight)
            
            break;

        case 'MensagemSala':
            
            if(MsgServer.Mensagem){

                document.getElementById('CorpoChatSala').innerHTML += '<br>'+MsgServer.Origem+': '+MsgServer.Mensagem
                document.getElementById('CorpoChatSala').scrollTo(0, document.getElementById('CorpoChatSala').scrollHeight)

            }
            else{

                switch(MsgServer.Acao){

                    case 'Entrou':

                        document.getElementById('CorpoChatSala').innerHTML += '<br>' + MsgServer.Origem + ' entrou na sala!'
                        document.getElementById('CorpoChatSala').scrollTo(0, document.getElementById('CorpoChatSala').scrollHeight)

                        break;

                    case 'Saiu':

                        document.getElementById('CorpoChatSala').innerHTML += '<br>' + MsgServer.Origem + ' saiu da sala!'
                        document.getElementById('CorpoChatSala').scrollTo(0, document.getElementById('CorpoChatSala').scrollHeight)

                        break

                }

            }

            break;
        
        case 'SalaCriada':
            
            document.getElementById('lobby').style.display = 'none'
            document.getElementById('sala').style.display = 'block'
            document.getElementById('DisplaySala').innerHTML = 'Nome: ' + nomeUser + '<br>' + MsgServer.nomeSala + '\tID: ' + (MsgServer.salaId+1)
            salaId = MsgServer.salaId
            websocket.send(JSON.stringify({tipo: 'MENSAGEMSALA', tipo2: 'ENTRADA', salaId: salaId, Origem: nomeUser}))
            document.getElementById('CorpoChatSala').innerHTML = ''
            
            break;
            
        case 'PedirSenha':

            var SenhaAux = prompt('Insira a senha da sala!')

            websocket.send(JSON.stringify({tipo: 'ENTRARSALA', salaId: MsgServer.salaId, Pass: SenhaAux}))

            break;

        case 'ListaOnline':
            
            if(document.getElementById('ListaUsuariosOnline').style.display == 'none'){
                break;
            }
            
            document.getElementById('ListaUsuariosOnline').innerHTML = 'Usuários Onlines <br><br>'
            
            for(var i = 0 ; i < MsgServer.NomesUsuariosOnline.length ; i++){
                
                document.getElementById('ListaUsuariosOnline').innerHTML += MsgServer.NomesUsuariosOnline[i] + '<br>'
                
            }
            
            break;
             
        case 'ListaUsuariosSala':
            
            document.getElementById('ListaUsuariosSala').innerHTML = 'Usuários Onlines <br><br>'
            
            for(var i = 0 ; i < MsgServer.NomesUsuariosSala.length ; i++){
                
                document.getElementById('ListaUsuariosSala').innerHTML += MsgServer.NomesUsuariosSala[i] + '<br>'
                
            }

            break;
            
        case 'PartidaIniciada':

            document.getElementById('login').style.display = 'none'
            document.getElementById('lobby').style.display = 'none'
            document.getElementById('sala').style.display = 'none'
            document.getElementById('jogo').style.display = 'block'

            document.getElementById('HeaderJogo').innerHTML = 'Jogadores:<br>'+nomeUser

            MsgServer.Jogadores.splice(MsgServer.Jogadores.indexOf(nomeUser),1)

            if(MsgServer.Vez){
                document.getElementById('HeaderJogo').innerHTML += ' --> X (INICIA)<br>'+MsgServer.Jogadores[0]
                document.getElementById('HeaderJogo').innerHTML += ' --> O<br'
            }
            else{
                document.getElementById('HeaderJogo').innerHTML += ' --> O<br>'+MsgServer.Jogadores[0]
                document.getElementById('HeaderJogo').innerHTML += ' --> X (INICIA)<br'
            }

            break;

        case 'AtualizaCampo':

            var y = MsgServer.Coordenadas[0]
            var x = MsgServer.Coordenadas[1]

            if(MsgServer.Simbolo == 'X'){

                document.getElementById('imgCell'+y+x).src = './icone-x.png'

            }
            else if(MsgServer.Simbolo == 'O'){

                document.getElementById('imgCell'+y+x).src = './icone-o.png'

            }           
            
            break;
        
        case 'Velha':

            for(var i = 0 ; i < 3 ; i++){
                for(var k = 0 ; k < 3 ; k++){

                    document.getElementById('cell'+i+k).style.backgroundColor = 'red'

                }

            }

            document.getElementById('SairPartida').style.display = 'block'
            document.getElementById('DesistirPartida').style.display = 'none'

            alert('VELHA!!!')

            break;

        case 'Vitoria':

            switch(MsgServer.tipo2){

                case 'Normal':

                    for(var i in MsgServer.CoordenadasVitoria){
                        var coord = MsgServer.CoordenadasVitoria[i]
                        document.getElementById('cell'+coord[0]+coord[1]).style.backgroundColor = 'blue'
        
                    }
        
                    alert('PARABÉNS '+nomeUser+' VOCÊ GANHOU!!!')

                    break;
                
                case 'Desistencia':

                    alert('O USUÁRIO '+MsgServer.Desistente+' DESISTIU DA PARTIDA!!!')

                    break;

            }

            document.getElementById('SairPartida').style.display = 'block'
            document.getElementById('DesistirPartida').style.display = 'none'

            break;
        
        case 'Derrota':

            for(var i in MsgServer.CoordenadasDerrota){
                var coord = MsgServer.CoordenadasDerrota[i]
                document.getElementById('cell'+coord[0]+coord[1]).style.backgroundColor = 'red'

            }

            document.getElementById('SairPartida').style.display = 'block'
            document.getElementById('DesistirPartida').style.display = 'none'

            alert('PERDESTE!!!')

            break;

    }
            
}

function Desistir(){
    
    document.getElementById('login').style.display = 'none'
    document.getElementById('lobby').style.display = 'block'
    document.getElementById('sala').style.display = 'none'
    document.getElementById('jogo').style.display = 'none'

    websocket.send(JSON.stringify({tipo: 'DESISTENCIA', salaId: salaId, Usuario: nomeUser}))

    ResetaTabuleiro()

}

function SairDaPartida(){
    
    document.getElementById('login').style.display = 'none'
    document.getElementById('lobby').style.display = 'none'
    document.getElementById('sala').style.display = 'block'
    document.getElementById('jogo').style.display = 'none'

    document.getElementById('SairPartida').style.display = 'none'
    document.getElementById('DesistirPartida').style.display = 'block'

    websocket.send(JSON.stringify({tipo: 'PARTIDAFINALIZADA', salaId: salaId}))

    ResetaTabuleiro()

}

function ResetaTabuleiro(){

    document.getElementById('HeaderJogo').innerHTML = ''

    for(var i = 0 ; i < 3 ; i++){
        for(var k = 0 ; k < 3 ; k++){

            document.getElementById('imgCell'+i+k).src = './vazio.png'
            document.getElementById('cell'+i+k).style.backgroundColor = 'white'

        }
    }

}
            
function SelecNome (evt){

    nomeUser = document.getElementById('nome').value;

    if(evt){

        if (evt.key == "Enter"){

            if((nomeUser.length < 3) || (nomeUser.length > 10)){
                alert("Tamanho do nome inválido (MIN: 3 MAX: 10)")
                return;
            }

            document.getElementById('DisplayNome').innerHTML = 'Nome: ' + nomeUser
            websocket.send(JSON.stringify({tipo:'NOME',NOME:nomeUser}))

            return;

        }else{
            return;
        }

    }
    else{

        if((nomeUser.length < 3) || (nomeUser.length > 10)){
            alert("Tamanho do nome inválido (MIN: 3 MAX: 10)")
            return;
        }

        document.getElementById('DisplayNome').innerHTML = 'Nome: ' + nomeUser
        websocket.send(JSON.stringify({tipo:'NOME',NOME:nomeUser}))

    }
    
}

function DesconectarUsuario (evt){

    websocket.send(JSON.stringify({tipo:'DESCONECTOU'}))
    document.getElementById('lobby').style.display = 'none'
    document.getElementById('UsuariosOnline').style.display = 'none'
    document.getElementById('login').style.display = 'block'
    
}

function EnviarMensagemLobby(evt){
    
    var texto = document.getElementById('CorpoMensagemLobby').value
    
    if(evt){
        
        if (evt.key == "Enter"){
            
            if(texto.length > 90){
                alert("Tamanho máximo da mensagem excedido! (MAX: 90)")
                return;
            }
            
            websocket.send(JSON.stringify({tipo: 'MENSAGEMLOBBY',Mensagem: texto,Origem: nomeUser}))
            document.getElementById('CorpoMensagemLobby').value = ''

            return;
            
        }else{
            return;
        }

    }
    else{
        
        if(texto.length > 90){
            alert("Tamanho máximo da mensagem excedido! (MAX: 90)")
            return;
        }
        
        websocket.send(JSON.stringify({tipo: 'MENSAGEMLOBBY',Mensagem: texto,Origem: nomeUser}))
        document.getElementById('CorpoMensagemLobby').value = ''
        
    }
}

function EnviarMensagemSala(evt){
    
    var texto = document.getElementById('CorpoMensagemSala').value
    
    if(evt){
        
        if (evt.key == "Enter"){
            
            if(texto.length > 90){
                alert("Tamanho máximo da mensagem excedido! (MAX: 90)")
                return;
            }
            
            websocket.send(JSON.stringify({ tipo: 'MENSAGEMSALA', 
                                            tipo2: 'MENSAGEM', 
                                            salaId: salaId, 
                                            Mensagem: texto, 
                                            Origem: nomeUser}))
            document.getElementById('CorpoMensagemSala').value = ''

            return;
            
        }else{
            return;
        }

    }
    else{
        
        if(texto.length > 90){
            alert("Tamanho máximo da mensagem excedido! (MAX: 90)")
            return;
        }
        
        websocket.send(JSON.stringify({tipo: 'MENSAGEMSALA', tipo2: 'MENSAGEM', salaId: salaId-1,Mensagem: texto,Origem: nomeUser}))
        document.getElementById('CorpoMensagemSala').value = ''
        
    }
}

function CriarSala(){
    
    var senha = prompt('Senha: ')
    
    websocket.send(JSON.stringify({tipo: "CRIARSALA", nomeCriador: nomeUser, salaSenha: senha}))
    
}

function SairSala(){
    
    document.getElementById('lobby').style.display = 'block'
    document.getElementById('sala').style.display = 'none'

    websocket.send(JSON.stringify({tipo: 'SAIUSALA', salaId: salaId}))
    websocket.send(JSON.stringify({tipo: 'MENSAGEMSALA', tipo2: 'SAIDA', salaId: salaId, Origem: nomeUser}))
    
    salaId = undefined

}

function EntrarSala(id){
    
    websocket.send(JSON.stringify({tipo: 'ENTRARSALA', salaId: id-1}))
    
}

function ListarOnline(){
    
    if(document.getElementById('SalasCriadas').style.display == 'block'){
        document.getElementById('SalasCriadas').style.display = 'none'
    }
    else{
        document.getElementById('SalasCriadas').style.display = 'block'
        document.getElementById('ListarOnline').innerHTML = 'Listar Usuarios Online'
    }
    if(document.getElementById('ListaUsuariosOnline').style.display == 'block'){
        document.getElementById('ListaUsuariosOnline').style.display = 'none'
    }
    else{
        document.getElementById('ListaUsuariosOnline').style.display = 'block'
        document.getElementById('ListarOnline').innerHTML = 'Listar Salas'
    }
    
}

function IniciarPartidaSala(){

    websocket.send(JSON.stringify({tipo: 'PARTIDAINICIADA', salaId: salaId}))

}

function Jogada(y , x){

    websocket.send(JSON.stringify({tipo: 'JOGADA', Coordenadas: [y,x], salaId: salaId}))

}

function onError (evt) {
}

startConnection();
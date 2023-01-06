var clients={} //store all the connected clients
var games={} //store all the available games
const WIN_STATES = Array([0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6])
const PORT=process.env.PORT||8080
const http=require('http').createServer((req,res)=>{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('Hello World!');
}).listen(PORT,console.log(`listening on port ${PORT}`))
const server=require('websocket').server
const socket=new server({"httpServer":http})
socket.on('request',(req)=>{
    const conn= req.accept(null,req.origin) //req accepted without checking
    const gameId=Math.round(Math.random()*100)+Math.round(Math.random()*100); //random ID created
    clients[gameId]={'conn':conn} //all the clients are given a conn object using which they can communicate with the server
    conn.send(JSON.stringify({
        'tag':'connected',
        'clientId':gameId
    }))
    sendAvailable()
    conn.on('message',onCreate)
})

function sendAvailable()  //sends all available games
{
    const availList=[];
    for(const game in games){
     if(games[game].players.length!==2) //if game has only 1 player then it is available
     {
        availList.push(game);
     }
    }
    console.log(games);
    for(const client in clients)
    {
        clients[client].conn.send(JSON.stringify({
            'tag':'gamesAvailable',
            'list':availList
        }))
    }
}

function PlayerTurn(gameId)
{
  games[gameId].players.forEach(player=>{
    clients[player.clientId].conn.send(JSON.stringify({
        'tag':'playerturn',
        'isTurn':player.isTurn,
        'board':games[gameId].board
    }))
  })
}

function CheckWin(gameId)
{
  return (WIN_STATES.some(state=>{
    return (state.every(cell =>{
        return games[gameId].board[cell]==='x'
    })||state.every(cell=>{
        return games[gameId].board[cell]==='o'
    }))
  }))
}

function CheckDraw(gameId)
{
    return (WIN_STATES.every(state=>{
      return (
        state.some(cell=>{
            return games[gameId].board[cell]==='x'
        })&&
        state.some(cell=>{
            return games[gameId].board[cell]==='o'
        })
      )

    }))
}

function onCreate(message){
  const data=JSON.parse(message.utf8Data)
  if(data.tag==='create')
  {
    const gameId=Math.round(Math.random()*100)+Math.round(Math.random()*100)+Math.round(Math.random()*100);
    const board=['','','','','','','','',''];  //create an empty board
    const player={
        'clientId':data.clientId,
        'symbol':'x',
        'isTurn':true
    }
    const players=Array(player)
    games[gameId]={'board':board,'players':players}
    clients[data.clientId].conn.send(JSON.stringify({
        'tag':'gamecreated',
        'gameId':gameId
    }))
    sendAvailable()

  }

  if(data.tag==='join')
  {
    const newplayer={
        'clientId':data.clientId,
        'symbol':'o',
        'isTurn':false
    }
    games[data.gameId].players.push(newplayer)
    sendAvailable()
    games[data.gameId].players.forEach(player=>{
        clients[player.clientId].conn.send(JSON.stringify({
            'tag':'start',
            'symbol':player.symbol
        }))
    })
    PlayerTurn(data.gameId)
  }
  if(data.tag==='moveMade')
  {
    games[data.gameId].board=data.board;
    const ifWin=CheckWin(data.gameId)
    const ifDraw=CheckDraw(data.gameId)
    if(ifWin)
    {
        games[data.gameId].players.forEach(player=>{
            clients[player.clientId].conn.send(JSON.stringify({
                'tag':'winner',
                'winner':player.symbol
            }))
        })
    }
    
    else if(ifDraw)
    {
        games[data.gameId].players.forEach(player=>{
            clients[player.clientId].conn.send(JSON.stringify({
                'tag':'draw',
                
            }))
        })
    }

    else{
        games[data.gameId].players.forEach(player=>{
            player.isTurn=!player.isTurn //change the turns 
        })
        PlayerTurn(data.gameId)
    }
  }

}

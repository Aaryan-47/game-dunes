let clientId; //stores the ID of the client 
let gameId;  
let socket;
let symbol; //stores the symbol x or o
const board=document.querySelector('.board');
const connect=document.querySelector('.connect')
const create=document.querySelector('.create')
const availGames=document.getElementById('Available')
const heading=document.getElementById('heading')
const cells=document.querySelectorAll('.cell')
create.disabled=true  //initially create button is disabled
const join=document.querySelector('.submit')
join.disabled=true  //initially join button is disabled
connect.addEventListener('click',(source)=>{
    socket = new WebSocket('ws://localhost:8080')  
    
    socket.onmessage=onMessage  //all the messages from the server are listened in the onMessage function
    //console.log(socket)
    source.target.disabled=true //disabling connect button
    
})

join.addEventListener('click',()=>{ 
  socket.send(JSON.stringify({'tag':'join','clientId':clientId,'gameId':gameId})) 
})

create.addEventListener('click',()=>{
    socket.send(JSON.stringify({
      'tag':'create',
      'clientId':clientId
    }))
})

function cellClicked(src)
{
    if(symbol=='x')
    {
      src.target.classList.add('x') 
    }
    else
    {
      src.target.classList.add('circle')
    }
    const updatedBoard=[] //update the board from scratch
    for(let i=0;i<9;i++)
    {
      if(cells[i].classList.contains('circle'))
      {
        updatedBoard[i]='o';
      }
      else if(cells[i].classList.contains('x'))
      {
        updatedBoard[i]='x';
      }
      else
      {
        updatedBoard[i]='';
      }
    }
    //console.log(updatedBoard)
    cells.forEach(cell=>{  //disallowing player to click twice
      cell.removeEventListener('click',cellClicked)
    })
    socket.send(JSON.stringify({
      'tag':'moveMade',
       'board':updatedBoard, //sending the updated board to the server
       'clientId':clientId, //ID of the client who made the move
       'gameId':gameId
    }))
}
function onMessage(message)
{
  const data=JSON.parse(message.data);
  if(data.tag==='connected')
  {
    heading.innerHTML=`You are connected :-PlayerId:${data.clientId} ` //displaying playerId on connection
    console.log(data.clientId)
    clientId=data.clientId
    create.disabled=false //enabling create and join buttons once connected
    join.disabled=false
  }
  if(data.tag==='gamesAvailable')
  {
    const games=data.list
    while(availGames.firstChild)
      {
        availGames.removeChild(availGames.lastChild) //deleting the previous available games list completely
      }
    games.forEach(game=>{
      
      const li=document.createElement('li') //now creating elements accordingly and adding them
      li.innerText=game;
      li.style.textAlign='center';
      console.log(li)
      availGames.appendChild(li)
      li.addEventListener('click',()=>{
        gameId=game  //updating the gameID on clicking 
      })
    })
  }
  if(data.tag==='gamecreated')
  {
    gameId=data.gameId;
    create.disabled=true
    join.disabled=true
    console.log(gameId)
  }
  if(data.tag==='start')
  {
    document.querySelector('.board').style.display='flex';
    symbol=data.symbol;
    if(symbol==='x')
    {
      board.classList.add('x'); 
    }
    else
    {
      board.classList.add('circle');
    }
  }
  if(data.tag==='playerturn')
  {
    cells.forEach(cell=>{ //deleting the board completely
      if(cell.classList.contains('x'))
      {
        cell.classList.remove('x')
      }
      if(cell.classList.contains('circle'))
      {
        cell.classList.remove('circle')
      }
    })
    for(let i=0;i<9;i++)
    {
      if(data.board[i]=='x') //now updating the board according to the "board" recieved by the server
      {
        cells[i].classList.add('x')
      }
      else if(data.board[i]=='o')
      {
        cells[i].classList.add('circle')
      }
    }
    if(data.isTurn)  
    {
      cells.forEach(cell=>{
        if(!cell.classList.contains('circle')&&!cell.classList.contains('x')) //if blankk cell then only clickable
        {
          cell.addEventListener('click',cellClicked)  
            
         
        }
      })
    }
  }
  if(data.tag==='winner')
  {
    alert(`The winner is ${data.winner}`)
  }
  if(data.tag==='draw')
  {
    alert("Game Draw")
  }

}
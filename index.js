const uws = require('uWebSockets.js')
const fs = require('fs')
let indexHtml = fs.readFileSync('index.html')
let gameHtml = fs.readFileSync('game.html')

let rooms = {
  qwe:{
    name:'qwe',
    objects:[]
  }
}

uws.App()
.ws('/:name', {
    compression:0,
    open: (ws,req)=>{
        let roomName = req.getParameter('name')
        rooms[roomName].objects.push({ws,x:10,y:10})
        console.log(ws.getRemoteAddress())
    },
    close: (ws,code,message) =>{
      console.log(ws,code,message)
    },
    message:(ws,message,isBinary)=>{
        let ok = ws.send(message, isBinary)
    }
})
.get('/room/:name', (req,res)=>{
    let roomName = res.getParameter('name') 
    let roomData = rooms[roomName]
    if(roomData){
        req.end(JSON.stringify({ok:true,result:roomData}))
        return
    }

    req.end(JSON.stringify({
        ok:false,
        error:'Комната не создана'
    }))
})
.post('/room/:name/create', (req,res)=>{
    let roomName = res.getParameter('name') 
    let roomData = rooms[roomName]
    if(roomData){
        req.end(JSON.stringify({
            ok:false, 
            error:'Комната уже создана'
        }))
        return
    }
    
    rooms[roomName] = {
        name:roomName,
        objects:[]
    }
    req.end(JSON.stringify({ok:true, result:rooms[roomName]}))
})
.get('/game/*', (req,res)=>{
    req.end(gameHtml)
})
.any('/*', (req,res)=>{
    req.end(indexHtml)
})
.listen(9090, (listenSocket)=>{
    if(listenSocket){
        console.log('Listen port 9090')
    }
})

let tick = ()=>{
    for (const roomName in rooms) {
        let room = rooms[roomName]
        let objects = room.objects.map(i=>{
            return {
                x:i.x,
                y:i.y
            }
        })
        for (const object of room.objects) {
          try{
            object.ws.send(JSON.stringify(objects),false)
          }
          catch(e){
            delete object
          }
        }
    }
}

setInterval(tick, 100)

const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Route = require('../../models/Route')
const Robot = require('../../models/Robot')
// variables and constants used by path finding algorithm
var rows=10;
var cols=26;
var grid = new Array(cols);
var openSet = [];
var closedSet = [];
var cameFrom = [];
var start ;
var end ;

function Cell(i,j){
  this.i=i
  this.j=j
  this.f=0
  this.g=0
  this.h=0
  this.neighbours = [];
  this.prev = undefined;
  this.wall = true;

  j = Math.abs(rows - j) ;


  if( j>=2 &&j<=10){
    if(i>=0&&i<=3){
      this.wall = false;
    }
  }

  if(j>=0&&j<=2){
    this.wall=false;
  } 
  
  this.show = function(col){
    fill(col);
    if(this.wall){
      fill(0)
    }
    noStroke();
    rect(this.i*w,this.j*h,w-1,h-1) 
  }

  this.addNeighbours = function (grid){
    var i = this.i;
    var j = this.j;
    // add neighbours that inside the grid
    if(i < cols-1){
     this.neighbours.push(grid[i+1][j]);
    }
    if(j < rows-1){
     this.neighbours.push(grid[i][j+1]);
    }
    if(i>0){
     this.neighbours.push(grid[i-1][j]);
    }
    if(j>0){
     this.neighbours.push(grid[i][j-1]);
    }

  }
}

function heuristic(a,b){
  var d = Math.abs(a.i,b.i)+Math.abs(a.j,b.j);
  return d
}

var map = (function (){
  var executed = false;
 return function () {
   if(!executed){
     executed=true;
  //setting up 2D array
 for( var i =0;i<cols;i++){
   grid[i]=new Array(rows)
 }

 // populate map cells
 for( var i =0;i<cols;i++){
  for(var j=0;j<rows;j++){
    grid[i][j]=new Cell(i,j);
  }
 }
 // add cells neighbours
 for( var i =0;i<cols;i++){
  for(var j=0;j<rows;j++){
    grid[i][j].addNeighbours(grid)
  }
 }
}
//  // 
//  start = grid[0][0];
//  end = grid[9][6];

//  openSet.push(start);
};
})();

 const bodyParser = require('body-parser');

 router.get("/getPath", async (req, res) => {
  try {
    const currentRoute = await Route.find();
    const robotRoute = currentRoute[0].path;
    return res.status(200).send({ data: robotRoute })
  } catch (error) {
    return res.status(400).send({ msg: error.message })
  }
}
);
var request = require('request-promise');
router.post("/sendPath", async (req, res) => {
  try {
    const robot = await Robot.find();
    const ourRobot = robot[0];
    if (ourRobot.processed === 'idle') {
      const currentRoute = await Route.find();
      const robotRoute = currentRoute[0].path;
      console.log(robotRoute)
      var returndata;
      var options = {
        method: 'POST',
        uri: 'http://192.168.137.168:5000',
        body: robotRoute,
        json: true // Automatically stringifies the body to JSON
      };
      var sendrequest = await request(options)
        .then(function (parsedBody) {
          console.log(parsedBody); // parsedBody contains the data sent back from the Flask server
          returndata = parsedBody; // do something with this data, here I'm assigning it to a variable.
        })
      console.log(returndata)
    }
  } catch (error) {
    return res.status(400).send({ msg: error.message })
  }
});
//Convert points to directions

router.post('/dir', async (req, res) => {
  try {
    console.log(req.body)
    const points = req.body.points
    var lastPoint = [];
    var dir = [];
    var incdec = [];
    for (var i = 0; i < points.length - 1; i++) {
      if (i == 0) {
        dir.push('F')
        if (points[i][0] !== points[i + 1][0]) {
          lastPoint.push('X')
          if (points[i][0] < points[i + 1][0]) {
            incdec.push('+')
          }
          else {
            incdec.push('-')
          }
        }
        else {
          lastPoint.push('Y')
          if (points[i][1] < points[i + 1][1]) {
            incdec.push('+')
          }
          else {
            incdec.push('-')
          }
        }
      }
      else {
        if (points[i][0] !== points[i + 1][0]) {
          if (lastPoint[lastPoint.length - 1] === 'X') {
            dir.push('F')
          }
          else {
            if (points[i][0] < points[i + 1][0]) {
              if (incdec[incdec.length - 1] === '-') {
                dir.push('L')
              }
              else {
                dir.push('R')
              }
              incdec.push('+')
            }
            else {
              if (incdec[incdec.length - 1] === '-') {
                dir.push('R')
              }
              else {
                dir.push('L')
              }
              incdec.push('-')
            }
            lastPoint.push('X')
          }
        }
        else {
          if (lastPoint[lastPoint.length - 1] === 'Y') {
            dir.push('F')
          }
          else {
            if (points[i][1] < points[i + 1][1]) {
              if (incdec[incdec.length - 1] === '-') {
                dir.push('R')
              }
              else {
                dir.push('L')
              }
              incdec.push('+')
            }
            else {
              if (incdec[incdec.length - 1] === '-') {
                dir.push('L')
              }
              else {
                dir.push('R')
              }
              incdec.push('-')
            }
            lastPoint.push('Y')
          }
        }
      }
    }
    console.log(dir)
    console.log(incdec)
    console.log(lastPoint)
    return res.status(200).send({ msg: 'hi', data: dir })
  }
  catch (error) {
    // We will be handling the error later
    console.log(error)
  }
})

 // use path finding algorithm to get new route
 router.post("/path" , async (req,res)=>{
  try{
     
    console.log(req.body)
    map();
    
    var si = req.body.start.x;
    var sj = req.body.start.y;
    start = grid[si][sj];
    console.log("---------------------------")
   // console.log(req.body)
   // console.log("nada")
    var ei = req.body.end.x;
    var ej = req.body.end.y;
  //  console.log(ei)
   // console.log(ej)
    end = grid[ei][ej];
    openSet.push(start);
    //console.log(openSet)
    
    while(openSet.length>0){
      var min = 0;
      for(var i =0;i<openSet.length;i++){
        if(openSet[i].f<openSet[min].f){
          min=i;
        }
      }
  
      var curr = openSet[min];
      
      if(curr===end){
        console.log("Done");
        var temp = curr ;
        cameFrom.push(temp);
        while(temp.prev){
          cameFrom.push(temp.prev);
          temp = temp.prev;
        }
  
      //   for( var i =cameFrom.length-1;i>=0;i--){
      //     if(cameFrom[i])
      // //    console.log(cameFrom[i].i+" , "+cameFrom[i].j );
      //   }
// ahemd's part
      //end ahmed's part
        var jason = [];
        for (var i = cameFrom.length - 1, sh = 0; i > -1; i-- , sh++) {
          jason[i] = [cameFrom[sh].i, Math.abs(9 - cameFrom[sh].j)]
        }
  
         // return  array
         var jfile = JSON.stringify(jason);
      //   console.log(jfile)
         return res.status(200).send({ msg: "path is calculated",data :jfile});

      }
  
      //1- remove curr from open set
      for( var i = openSet.length ; i>=0 ; i--){
        if(openSet[i] === curr){
          openSet.splice(i,1);
  
        }
      } 
      //2- add curr to closed set
        closedSet.push(curr);
  
      var neighbours = curr.neighbours;
     // console.log("neeeeeeeeeeeeeeeeeeeigbours")
     // console.log(curr)
      //console.log(neighbours)
      for( var i = 0 ; i<neighbours.length ;i++){
         var neighbour = neighbours[i];
         if(!closedSet.includes(neighbour)&& !neighbour.wall){
           var tentativeG = curr.g + heuristic(neighbour,curr);
  
           if(!openSet.includes(neighbour)){
             openSet.push(neighbour);
  
            }
            else if (tentativeG >= neighbour){
              continue;
            }
  
            neighbour.g = tentativeG ;
            neighbour.h = heuristic(neighbour,end);
            neighbour.f = neighbour.g + neighbour.h;
            neighbour.prev = curr; 
          }
      }
     // console.log("for this loop");
    }
    console.log("openList")
   // console.log(openSet)
      console.log("current")
   //   console.log(curr)
      //if not returned -> no solution
      return res.status(404).send({ msg: "path can't be calculated"});

  }
  catch(error){
    console.log(error);
    return res.status(400).send({ msg: "Request can't be done",error});
    
  }
})
  







router.get('/', async (req,res) => {
    const routes = await Route.find()
    res.json({data: routes})
})

router.get("/:id", async (req, res) => {
    const id = req.params.id;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        const u = await Route.findById(id);
        if(u)
          return res.json({ data: u });
        else
          return res.send({ msg: "Route is not found" });
      }
      else 
       return res.send({ error: "not valid Route id" });
    }
  );


router.post('/', async (req,res) => {
    try {
        // console.log(req.body)
        const newRoute = await Route.create(req.body)
    //  console.log(newRoute)
     res.json({msg:'Route was created successfully', data: newRoute})
    }
    catch(error) {
        // We will be handling the error later
        console.log(error)
    }  
 })
 
 // Update a route
 router.put('/:id', async (req,res) => {
     try {
    //   const id = req.params.id
      const route = await Route.findById(req.params.id)
      if(!route) return res.status(404).send({error: 'Route does not exist'})
      const updatedRoute = await Route.findByIdAndUpdate({_id : req.params.id},req.body)
      res.json({msg: 'Route updated successfully'})
     }
     catch(error) {
         // We will be handling the error later
         console.log(error)
     }  
  })
 
  
  router.delete('/:id', async (req,res) => {
     try {
      const id = req.params.id
      const deletedRoute = await Route.findByIdAndRemove(id)
      res.json({msg:'Route was deleted successfully', data: deletedRoute})
     }
     catch(error) {
         // We will be handling the error later
         console.log(error)
     }  
  })
 




 module.exports = router
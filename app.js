const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
var format = require('date-fns/format')

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();



const convertDbtoResponse=(obj)=>({
  id:obj.id,
  todo:obj.todo,
  priority:obj.priority,
  category:obj.category,
  dueDate:obj.due_date,
  status:obj.status  
})


app.get("/todos/",async (request,response)=>{
const {priority,status,category,due_date,search_q=""}=request.query 
let query
let text
let p
function valid(p){
const ar1=p.map(each=>(convertDbtoResponse(each)))
response.send(ar1)
}

function invalid(text) {
    response.status(400)
    response.send(`Invalid ${text}`)
}

const others =async (query)=>{
    p = await db.all(query)
    const ar1=p.map(each=>(convertDbtoResponse(each)))
    response.send(ar1)
    }

switch(true){
    case priority!==undefined && category!==undefined:
        query =`SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%' AND
        category='${category}' AND priority='${priority}'`
        others(query)
        break;

case priority!==undefined && status!==undefined:
 query =`SELECT * FROM todo 
WHERE todo LIKE '%${search_q}%' AND priority='${priority}' 
AND status='${status}'`; 
    others(query)

break;
case category!==undefined && status!==undefined:
 query =`SELECT * FROM todo WHERE
 todo LIKE '%${search_q}%'
 AND status='${status}'
 AND category='${category}'`
         others(query)

break;
case priority!==undefined:
 query =`SELECT * FROM todo WHERE 
 todo LIKE '%${search_q}%' AND 
 priority='${priority}'`
p = await db.all(query)
 console.log(p)
 if(p.length===0){
     text="Todo Priority"
     invalid(text)
 }
 else{
     valid(p)
 }

break;

case category!==undefined:
 query =`SELECT * FROM todo 
 WHERE todo LIKE '%${search_q}%'
  AND category='${category}'`
 p = await db.all(query)    
console.log(p)
 if(p.length===0){
     text="Todo Category"
     invalid(text)
 }
 else{
     valid(p)
 }

  break;

case due_date!==undefined:
 query =`SELECT * FROM todo 
 WHERE todo LIKE '%${search_q}%' 
 AND due_date='${due_date}'`;
 p = await db.all(query)
 console.log(p)
 if(p.length===0){
     text="Due Date"
     invalid(text)
 }
 else{
     valid(p)
 }
break;
case status!==undefined:
 query =`SELECT * FROM todo 
WHERE todo LIKE '%${search_q}%'
 AND status='${status}'`;
 p = await db.all(query)
 console.log(p)
 if(p.length===0){
     text="Todo Status"
     invalid(text)
 }
 else{
     valid(p)
 }
break;
default:
        
query =`SELECT * FROM todo WHERE
 todo LIKE '%${search_q}%'`
         others(query)

 break;

}

})


app.get("/todos/:todoId/",async (request,response)=>{
const {todoId}=request.params
    const query =`SELECT * FROM todo 
    WHERE id=${todoId}`
const todo = await db.get(query)
response.send(convertDbtoResponse(todo))
})


app.delete("/todos/:todoId/", async (request, response) => {
   const {todoId} = request.params
  const deleteTodosQuery = `DELETE FROM todo WHERE id=${todoId}`;
   await db.run(deleteTodosQuery);
  response.send("Todo Deleted");
});

app.get("/agenda/", async (request, response) => {
   const {date} = request.query
   const d1 = new Date(date)
   console.log(d1)
   if(d1==="Invalid Date"){
        response.status(400)    
        response.send("Invalid Due Date")
   }
   else{
    const date1 = format(new Date(date), 'yyyy-MM-dd')
      const TodoQuery = `SELECT * FROM todo WHERE due_date='${date1}'`;
   const todo = await db.all(TodoQuery);
   if(todo.length===0){
response.status(400)    
response.send("Invalid Due Date")
}
else   
{
   const list = todo.map(each=>(convertDbtoResponse(each)))
  response.send(list);   
}
}
  
});

app.post("/todos/", async (request, response) => {
  const {id,todo,priority,status,category,dueDate}=request.body
  const priorityAr = ["HIGH","LOW","MEDIUM"]
    const statusAr = ["TO DO","IN PROGRESS","DONE"]
  const cateAr = ["WORK","HOME","LEARNING"]
  console.log(priorityAr.includes(priority))
const date = new Date(dueDate)
console.log(date)
let invalid = false
  switch(false){
      case priorityAr.includes(priority):
          response.status(400)
          response.send("Invalid Todo Priority")
          invalid=true
          break;
        case statusAr.includes(status):
          response.status(400)
          invalid=true
          response.send("Invalid Todo Status")
            break;
          case cateAr.includes(category):
          response.status(400)
          invalid=true
          response.send("Invalid Todo Category")
            break;
           case date!=="Invalid Date":
            response.status(400)
           response.send("Invalid Due Date")
           invalid=true
           break; 
        }
if(!invalid){
    const createTodoQuery = `INSERT INTO todo 
    (id,todo,priority,status,category,due_Date)
    VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}')`;
  const todo12 = await db.run(createTodoQuery);
  response.send("Todo Successfully Added")
}
});


app.put("/todos/:todoId", async (request, response) => {
   const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id =${todoId}`;
  const todo1 = await db.get(getTodoQuery);
  const {status=todo1.status,
priority=todo1.priority,todo=todo1.todo,
category=todo1.category,dueDate=todo1.due_date}=request.body
console.log(category)
 const priorityAr = ["HIGH","LOW","MEDIUM",]
    const statusAr = ["TO DO","IN PROGRESS","DONE",]
  const cateAr = ["WORK","HOME","LEARNING",]
const date = new Date(dueDate)
console.log(date)
let invalid=false
  switch(false){
      case priorityAr.includes(priority):
          response.status(400)
          response.send("Invalid Todo Priority")
          invalid=true
          break;
        case statusAr.includes(status):
          response.status(400)
          response.send("Invalid Todo Status")
                    invalid=true

            break;
          case cateAr.includes(category):
          response.status(400)
          response.send("Invalid Todo Category")
                    invalid=true

            break;
           case date!=="Invalid Date":
                response.status(400)
           response.send("Invalid Due Date")
                     invalid=true

           break; 
  }
  if(!invalid){
let column = ""
const body = request.body
switch (true) {
    case body.status!==undefined:
        column="Status"
        break;
    case body.todo!==undefined:
        column="Todo"
        break;
    case body.priority!==undefined:
        column="Priority"
        break;
    case body.category!==undefined:
        column="Category"
        break;
    case body.dueDate!==undefined:
        column="Due Date"
        break;
}

const updateQuery = `UPDATE todo SET
todo='${todo}'
,priority='${priority}',status='${status}',
category='${category}',due_date='${dueDate}'
WHERE id = ${todoId}`
 await db.run(updateQuery)
 response.send(`${column} Updated`)
  }
});



module.exports = app
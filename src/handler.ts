import http from "http";
import { IncomingMessage , ServerResponse } from "http";
import jwt from "jsonwebtoken";

interface User{
    id : number;
    email : string;
    password : string;
}

interface Task{
    id : number;
    userId : number;
    title : string;
    completed : boolean;
}

interface AuthPayload{
    id : number;
    email : string;
    iat ?: number;
    exp ?:number;
}

const users : User[] = [];
const tasks : Task[]=[];
const JWT_SECRET = "mysecretkey";

//For parsing json body
function parseBody(req:IncomingMessage) : Promise<any>{
    return new Promise((resolve) => {
        let body ="";
        req.on("data",chunk => (body+=chunk));
        req.on("end", () =>{
            try{
                resolve(JSON.parse(body || "{}"));
            } catch{
                resolve({});
            }
        });
    });
}

//send response
function send(res: ServerResponse,statusCode:number,data:any):void{
    res.writeHead(statusCode,{"Content-Type" : "application/json"});
    res.end(JSON.stringify(data));
}

//extract and verify bearer token
function authenticate(req : IncomingMessage) : AuthPayload | null {
    const authHeader = req.headers["authorization"];
    if(!authHeader || !authHeader.startsWith("Bearer")) return null;
    try{
        const token = authHeader.split(" ")[1];
        return jwt.verify(token , JWT_SECRET) as AuthPayload;
    } catch {
        return null;
    }
}

//error reponse
function errorResponse(message : string , statusCode = 400){
    return {message , statusCode};
}

//Server code
const server = http.createServer(async(req: IncomingMessage , res:ServerResponse) => {
    const {method,url} = req;

    if(method === "POST" && url === "/register"){
        const {email,password} = await parseBody(req);
        if(!email || !password){
            return send(res,400,errorResponse("Email and password required!!"));
        }
        users.push({id: Date.now(), email, password});
        return send(res, 201, {message: "User registered"});
    }

    if(method === "POST" && url === "/login"){
        const {email, password} = await parseBody(req);
        const user = users.find(u => u.email === email && u.password === password);
        if(!user){
            return send(res,401,errorResponse("Invalid Credentials", 401));
        }
        const token = jwt.sign({id: user.id, email: user.email}, JWT_SECRET, {expiresIn: "1h"});
        return send(res, 200, {token});
    }

    if(method === "GET" && url === "/profile"){
        const user = authenticate(req);
        if(!user){
            return send(res, 401, errorResponse("Unauthorised", 401));
        } 
        return send(res,200,{user});
    }

    if(method === "GET" && url === "/tasks"){
        const user = authenticate(req);
        if(!user){
            return send(res,401, errorResponse("Unauthorised", 401));
        }
        const userTasks = tasks.filter(t => t.userId === user.id);
        return send(res, 200, userTasks);
    }

    if(method === "POST" && url === "/tasks"){
        const user = authenticate(req);
        if(!user){
            return send(res,401,errorResponse("Unauthorised", 401));
        }
        const {title} = await parseBody(req);
        if(!title){
            return send(res, 400, errorResponse("Task title required"));
        }
        const task: Task = {id: Date.now(), userId: user.id, title, completed:false};
        tasks.push(task);
        return send(res, 201, task);
    }

    return send(res, 404, errorResponse("Not Found", 404));
});

server.listen(3000, () => console.log("Server running at http://localhost:3000"));

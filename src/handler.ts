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
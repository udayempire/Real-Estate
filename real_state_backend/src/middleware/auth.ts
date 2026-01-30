import { NextFunction, Request, Response } from "express";
import { TokenPayload, verifyAccessToken } from "../utils/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction){
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            res.status(401).json({error: 'No token provided'});
            return;
        }
        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);
        req.user = payload;
        next()
    }catch(err){
        return res.status(401).json({ error: "Invalid or expired token"});
    }
}
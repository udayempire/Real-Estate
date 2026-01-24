import Jwt, {JwtPayload, SignOptions} from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCES_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

if(!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET){
    throw new Error("JWT secrets missing in env")
}

export interface TokenPayload extends JwtPayload {
    id: string,
    role?: string
}

//sign access token 15 mins(short)

export function signAccessToken(payload: {
    id: string,
    role: string
}){
    return Jwt.sign(payload,ACCESS_TOKEN_SECRET,{expiresIn:'15m'})
}


//sign access token 7 days(long)
export function signRefreshToken(payload: {
    id: string,
    role: string
}){
    return Jwt.sign(payload,ACCESS_TOKEN_SECRET,{expiresIn:'7d'})
}

export function verifyAccessToken(token:string): TokenPayload | null {
    try {
        return Jwt.verify(token,ACCESS_TOKEN_SECRET) as TokenPayload;
    }catch{
        return null
    }
}


import { Request, Response, NextFunction } from "express"
import jwt, {VerifyErrors} from "jsonwebtoken";
import 'dotenv/config'

const secret_key = process.env.SECRET_KEY

export const auth = async (req: any, res: Response, next: NextFunction) => {

    try {
        let token = req.headers["access-token"];
        if(token){
            jwt.verify(token, secret_key!, (err: VerifyErrors | null, decoded: any) => {
                if(err){
                    res.status(401).json({error: "Not authenticated"})
                }else{
                    req.userId = decoded.id;
                    next();
                }
            })
        }else{
            return res.status(401).json({error: "Provide a token"})
        }
    } catch (error) {
        
    }
}


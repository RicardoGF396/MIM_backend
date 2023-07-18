import { Request, Response, NextFunction } from "express"
import jwt, {VerifyErrors} from "jsonwebtoken";
import 'dotenv/config'

export const auth = async (req: any, res: Response, next: NextFunction) => {
    try {
        //Tiene que ser minúscula
        let token = req.headers["access-token"];
        if(token){
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err: VerifyErrors | null, decoded: any) => {
                if(err){
                    res.json({error: "Not authenticated"})
                }else{
                    req.userId = decoded.id;
                    next();
                }
            })
        }else{
            return res.json({error: "Provide a token"})
        }
    } catch (error) {
        return res.json({
            error: "Error in server"
        })
    }
}


import { Place } from "./Place";

export interface Mural {
    id?: number,
    name:string,
    places:Array<Place>,
    images?:string,
}
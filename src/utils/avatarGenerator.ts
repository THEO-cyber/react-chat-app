import {generate} from "random-words" 

export default function AvatarGenerator(text?:string){
    return `https://api.multiavatar.com/${text || generate()}.png`;
}
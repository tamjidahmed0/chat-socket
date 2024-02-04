import mongoose from "mongoose";


const disableSchema = new mongoose.Schema({
    Id:{ 
        type:String
    },
    Username:{
        type:String
    },
    Title:{
        type:String
    },
    Text:{
        type:String
    }
})

const collection = mongoose.model('DisableId', disableSchema)

export default collection
import mongoose from "mongoose";



const requestSchema = new mongoose.Schema({

    senderName:{
        type:String
    },
    receiverName:{
        type:String
    },
    Name:{
        type:String
    },
    text:{
        type:String
    },
    members:{
        type:Array
    },
    conversationFor: {
        type:mongoose.Types.ObjectId,
        ref: 'User'
    },
    For:{
        type:mongoose.Types.ObjectId,
        ref: 'User'
    },
    // userId:{
    //     type:String
    // },
    date:{
        type:Date,
        default:Date.now
    }
})

const collection = mongoose.model('request', requestSchema)

export default collection
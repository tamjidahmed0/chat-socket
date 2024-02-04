import mongoose from "mongoose";



const profileSchema = new mongoose.Schema({
   Id:{
    type:String
   },
   name:{
    type:String
   },
   username:{
    type:String
   },
   profilePic:{
    type:String
   }
})

const collection = mongoose.model('Profile', profileSchema)

export default collection
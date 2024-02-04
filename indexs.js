// Import dependencies
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import messageSchema from './models/message.js';
import userschema from './models/user.js'
import conversationSchema from './models/conversation.js'
import moment from 'moment'

import connectDB from './config/db.js';

const PORT =  9000

// Set up express app 
const app = express();
const server = http.createServer(app);

// Set up cors
app.use(cors());

// Set up socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Connect to MongoDB database
// mongoose.connect('mongodb://127.0.0.1:27017', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.log(err));

// Define a route to query data from MongoDB
app.get('/messages', async (req, res) => {
  try {
    // Query data from MongoDB
    const messages = await messageSchema.find();

    // Emit the messages to connected sockets
    io.emit('messages', messages);

    // Send the messages to the client 
    res.json(messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Listen for socket.io connections
const connectedUsers = {};

io.on('connection', async(socket) => {
console.log('User connected:', socket.id);

// Store the socket ID of the connected user
connectedUsers[socket.id] = true;


// Send the list of connected users to all connected clients
io.emit('users', Object.keys(connectedUsers));
console.log(connectedUsers)

//   //collect userid
// socket.on('userId',(userId)=>{
//     // console.log(userId)
//     connectedUsers[ userId.userId] = true
//     connectedUsers[userId.receiverId] = true
// }) 



socket.on('userId',async(userId)=>{

//msg logic
const messages = await messageSchema.find({
  $or: [
    { senderId: userId.senderId, receiverId: userId.receiverId },
    { senderId: userId.receiverId, receiverId: userId.senderId },
  ],

});

let array= []



for(const item of messages){
 
  const user = await userschema.findById(item.senderId)    
  const createdAt = moment(item.date);
  const now = moment()
  const duration = moment.duration(now.diff(createdAt));

  const years = duration.years();
  const months = duration.months();
  const days = duration.days();

  const date = moment(item.date);
  const getFormattedDate = (date)=>{
    if( Math.abs(years) ){
      return `${date.format('MMM DD YYYY')} AT ${date.format('hh:mm A')} `
    }
    else if(Math.abs(months)){
      return `${date.format('MMM DD')} AT ${date.format('hh:mm A')} `
    }
    else if(days){         
      return `${date.format('ddd')} AT ${date.format('hh:mm A')} `
    }else {
      return date.format('hh:mm A')
    }    
}

  if(item.senderId === userId.senderId){
    console.log('sender,,,', item)
    array.push({iSend: item.senderId,msgId:item._id, name:user.name, text:item.text, Date:getFormattedDate(date)})
  }else if(item.senderId === userId.receiverId){
    // console.log('reciever,,,,', item.text) 
    array.push({whoSend: item.senderId , msgId:item._id, name:user.name, text:item.text, Date: getFormattedDate(date)})
  }
}
// res.status(200).json(array);

//emit the msg
socket.emit('msg', array)





//send msg
socket.on('sendmsg', async(msgData)=>{
  const senderId = msgData.senderId

  console.log(msgData)

  const newMessage = new messageSchema({senderId:senderId, receiverId:msgData.receiverId, text:msgData.text});  

  
   newMessage.save((err, success)=>{
      if(err) return console.log('404 error')
      if(success){
        userschema.find(
          { 
            $or: [ 
              { _id: success.senderId },
              { _id: success.receiverId}
                 ] }
           , (err, findUser)=>{
          if(err) return console.log('404 error')
          if(findUser){




        conversationSchema.findOne({ $and:[
          {members: {$in:[success.senderId]}}, 
          {members: {$in:[success.receiverId]}}
          
        ] }, async(err, find)=>{
          if(err) return console.log('error')
          console.log(success.senderId)      
          if(find){
           await conversationSchema.findOneAndUpdate({
              $and:[
                {members: {$in:[success.senderId]}},
                {members: {$in:[success.receiverId]}}
                
              ]
            },{
              text: success.text,
              
            }) 
            
            // res.status(200).json(success); 
            console.log(success)
            }
          else{
            const conversation = new conversationSchema({
              senderName: '',
              receiverName:'',
              text:'',
              members:[success.senderId,success.receiverId]
            })
              // console.log(success)

            if(findUser[0]._id.toString() === senderId ){
              conversation.senderName = findUser[0].name;
              conversation.receiverName = findUser[1].name; 
              conversation.text = success.text
            }else{ 
              conversation.senderName = findUser[1].name;
              conversation.receiverName = findUser[0].name;
              conversation.text = success.text
            }

            conversation.save()
            // res.status(200).json(success);
            console.log(success, '205 line')

          }
        })
         
          }
        })

      }
    });
    
 






})



})







  
//sender
socket.on('sender', (data)=>{
  socket.emit('sender', data)
  console.log(data)

})


//if user disconnect
socket.on('disconnect', () => {
console.log('User disconnected:', socket.id);

// Remove the socket ID of the disconnected user
delete connectedUsers[socket.id];

// Send the updated list of connected users to all connected clients
io.emit('users', Object.keys(connectedUsers));

  });
});

// // Start the server
// server.listen(9000, () => console.log('Server listening on port 9000'));

connectDB().then(()=>{
  server.listen(PORT, ()=>{
    console.log('mongodb connected and posrt is 9000')
  })
}).catch((err)=>{
  console.log(err)
})





  // io.on('connection', (socket) => {
  //   console.log('a user is connected')
  //   socket.on('private message', ({ message, recipientId }) => {
  //     console.log(socket.userId)
  //     // Check that the recipient ID matches the ID of the socket user
  //     if (socket.userId === recipientId) {
  //       const roomId = `private-${recipientId}`;
  //       socket.join(roomId);
  //       socket.to(roomId).emit('private message', { message });
  //     } else {
  //       // Handle case where user is not authorized to receive the message
  //       console.log('Unauthorized private message request');
  //     }
  //   });

  //   socket.on('disconnect', ()=>{
  //     console.log('a user is disconnect')
  //   })
  // });
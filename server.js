import express from 'express';
import dotenv from 'dotenv';
import http from 'http'; // Import the http module
import { Server } from 'socket.io';
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import cors from "cors";
import path from 'path';
import {fileURLToPath} from 'url';


//configure env
dotenv.config();

//databse config
connectDB();

// ESmodule
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//PORT
const PORT = process.env.PORT || 8000;


//rest object
const app = express();
const server = http.createServer(app); // Create HTTP server instance


//middelwares
app.use(cors({
    origin: 'https://echochat.vercel.app/'
  }));
// app.use(express.json());

// Increase payload size limits for JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Socket.IO configuration
const io = new Server(server, {
    cors: {
      origin: 'https://echochat.vercel.app/',
      methods: ['GET', 'POST'],
      allowedHeaders: ['my-custom-header'],
      credentials: true
    }
  }); // Pass the HTTP server instance to the Socket.IO Server

  io.on('connection', socket => {
    const id = socket.handshake.query.id;
    socket.join(id);
    
    socket.on('send-message', ({ recipients, text }) => {
        recipients.forEach(recipient => {
            const newRecipients = recipients.filter(r => r !== recipient);
            newRecipients.push(id);
            io.to(recipient).emit('receive-message', {
                recipients: newRecipients,
                sender: id,
                content: text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
        });
    });
});




//routes
app.use("/api/auth", authRoutes);

//rest api
app.use("*", function(req, res){
  res.sendFile(path.join(__dirname, "./client/build/index.html"))
})

//run listen
server.listen(PORT, () => {
    console.log(`Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`);
});



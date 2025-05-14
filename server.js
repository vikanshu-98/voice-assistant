import express from 'express';
import {config } from 'dotenv';
import cors from 'cors';
import path from 'path';  
import { log } from 'console';
config()
const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());    
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), 'public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPEN_OPENAI_API_KEY = process.env.OPENAI_API_KEY; 

let sessions={}

app.post('/api/gemini' , async(req , res)=>{
 
   try {
    const {type,text,name,sessionId} = req.body
     
    if(!sessions[sessionId]){
        sessions[sessionId] = {
            name:'',
            history:[]
        }
    }

    const currentSession  = sessions[sessionId] 
    if(type==='init' && name){
        currentSession.name = name
        currentSession.history = []
        return res.status(200).json({reply:`Hi ${name}, i am niko your ai girlfriend, what do you want to talk about?`})
    }

    currentSession.history.push({role:'user',text})
    const prompt = [
        {
            text:  `you are Niko,the angry AI girlfriend of ${currentSession.name} ||vikanshu . Respond in short,emotional, human style answers.`
        }
    ]

    const contents = currentSession.history.map(msg=> ({
        role:msg.role,
        parts:[{text:msg.text}]
    }))

    console.log(contents)

    const body={
        system_instruction: {
            parts:prompt
        },
        contents
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
           {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });

    const data = await response.json(); 
    console.log(data);
    
    const reply = data?.candidates[0]?.content?.parts[0]?.text || "Sorry, I didn’t get that.";
    currentSession.history.push({role:'model',text:reply})

    res.status(200).json({ reply });

   }catch (error) {
       console.error('Error:', error);
       res.status(500).json({ error: 'Internal Server Error' });
    
   }
})

app.post('/api/speak', async(req,res)=>{
    try {
        const {text}    = req.body
        const response  =  await fetch(
            'https://api.openai.com/v1/audio/speech',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPEN_OPENAI_API_KEY}`
                },
                body: JSON.stringify(
                    {
                        model: 'tts-1',
                        input:text,
                        voice:'nova',
                        response_format:'mp3'
                    }
                )
            }
        )

        const audio = await response.arrayBuffer();
        // console.log(audio);
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audio.byteLength
        }); 

       return res.send(Buffer.from(audio));

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


app.get('/second',(req,res)=>{
    return res.sendFile(path.join(path.resolve(),'/public/second.html'))
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
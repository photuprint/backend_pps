// require('dotenv').config({path:'./env'})
import mongoose from 'mongoose';
import dotenv from "dotenv"
import connectDB from './db/index.js'

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8080, ())
})
.catch((err)=>{
    console.log("MONGO db connection failed!!!", err);
})





/*
import express from "express";
const app = express()
( async()=>{
    try {

        mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        appendFile.on("error", (error) => {
            console.log("ERR:", error);
            throw error
        })
        appendFile.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch(error) {

        console.error("ERROR", error)
        throw err
    }
})()

*/
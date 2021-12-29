require('dotenv').config()

const mongoose = require('mongoose')

const DB_URI = process.env.db_url

mongoose.connect(DB_URI,{useNewUrlParser:true, useUnifiedTopology:true})

const connection = mongoose.connection

module.exports = connection
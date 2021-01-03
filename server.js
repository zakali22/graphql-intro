const express = require('express')
const {graphqlHTTP} = require("express-graphql")
const app = express()
const schema = require('./schema/schema')

app.use('/graphql', graphqlHTTP({ // Define a middleware that intercepts any request to endpoint /graphql and direct towards to graphql
    schema,
    graphiql: true // To use the tool for development
}))

app.get('/', (req, res) => {
    res.send('Please go to /graphql')
})


// Listen to server
app.listen(3001, () => {
    console.log("Listening on port 3001")
})
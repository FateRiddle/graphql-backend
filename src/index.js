const express = require('express')
const bodyParser = require('body-parser')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')

const app = express()

const schema = require('./schema')

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

const PORT = 3000

app.listen(PORT, () => {
  console.log(`HackerNews graphql server running on port ${PORT}`)
})

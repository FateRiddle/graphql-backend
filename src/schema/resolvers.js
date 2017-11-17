const { ObjectID } = require('mongodb')
const pubsub = require('../pubsub')

module.exports = {
  Query: {
    allLinks: async (root, data, { mongo: { Links } }) => {
      const res = await Links.find({}).toArray()
      return res
    },
  },
  Mutation: {
    createLink: async (root, data, { mongo: { Links }, user }) => {
      // assertValidLink(data)
      const newLink = {
        ...data,
        postedById: user && user._id,
      }
      const response = await Links.insert(newLink)
      //1  subsciption
      pubsub.publish('Link', { Link: { mutation: 'CREATED', node: newLink } })

      return {
        id: response.insertedIds[0],
        ...newLink,
      }
    },

    createVote: async (root, data, { mongo: { Votes }, user }) => {
      const newVote = {
        userId: user && user._id,
        linkId: new ObjectID(data.linkId),
      }
      const response = await Votes.insert(newVote)
      return {
        id: response.insertedIds[0],
        ...newVote,
      }
    },

    createUser: async (root, { name, authProvider }, { mongo: { Users } }) => {
      const newUser = {
        name,
        email: authProvider.email.email,
        password: authProvider.email.password,
      }
      const response = await Users.insert(newUser)
      return {
        id: response.insertedIds[0],
        ...newUser,
      }
    },

    signinUser: async (root, data, { mongo: { Users } }) => {
      const user = await Users.findOne({ email: data.email.email })
      if (data.email.password === user.password) {
        return {
          token: `token-${user.email}`,
          user,
        }
      }
    },
  },
  //2 subscription
  Subscription: {
    Link: {
      subscribe: () => pubsub.asyncIterator('Link'),
    },
  },

  Link: {
    id: root => root._id || root.id,
    postedBy: async ({ postedById }, data, { mongo: { Users } }) => {
      return await Users.findOne({ _id: postedById })
    },
    votes: async ({ _id }, data, { mongo: { Votes } }) => {
      return await Votes.find({ linkId: _id }).toArray()
    },
  },

  Vote: {
    id: root => root._id || root.id,
    user: async ({ userId }, data, { mongo: { Users } }) => {
      return await Users.findOne({ _id: userId })
    },
    link: async ({ linkId }, data, { mongo: { Links } }) => {
      return await Links.findOne({ _id: linkId })
    },
  },

  User: {
    id: root => root._id || root.id,
    votes: async ({ _id }, data, { mongo: { Votes } }) => {
      return await Votes.find({ userId: _id }).toArray()
    },
  },
}

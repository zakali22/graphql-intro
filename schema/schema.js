const graphql = require('graphql')
const axios = require('axios')
const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLSchema, GraphQLList, GraphQLNonNull} = graphql

// Define our schema for positions
const PositionType = new GraphQLObjectType({
    name: 'Position',
    fields: () => ({
        id: { type: GraphQLString },
        title: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType),
            resolve(parentValue, args){
                return axios.get(`http://localhost:3000/positions/${parentValue.id}/users`).then(res => res.data)
            }
        }
    })
})

// Define our schema for companies
const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType), // Here we are returning a list of all UserType
            resolve(parentValue, args){
                // To get fetch all users related to a specific company: .../companies/2/users
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`).then(res => res.data)
            }
        }
    })
})

// Define our schema for user
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({ // We use method to allow for closure so that UserType has access to CompanyType and vice versa
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: {
            type: CompanyType,
            resolve(parentValue, args){
                return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`).then(res => res.data)
            }
        },
        position: {
            type: PositionType,
            resolve(parentValue, args){
                return axios.get(`http://localhost:3000/positions/${parentValue.positionId}`).then(res => res.data)
            }
        },
        friends: {
            type: new GraphQLList(UserType),
            resolve(parentValue, args){
                let friends = []

                return axios.get(`http://localhost:3000/users/${parentValue.id}`).then(res => {
                    let friendsIds = res.data.friends;
                    
                    for(let friend in friendsIds){
                        let {friendId} = friendsIds[friend]
                        friends.push(axios.get(`http://localhost:3000/users/${friendId}`))
                    }
                }).then(res => {
                    return axios.all(friends).then((res) => {
                        const results = res.map(r => {
                            return r.data
                        })
                        return results
                    })
                })
            }
        }
    })
})

// Define our RootQuery to return our schemas and fetch data
const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        users: {
            type: new GraphQLList(UserType), // Returning a list of UserType
            resolve(parentValue, args){
                return axios.get('http://localhost:3000/users').then(res => res.data)
            }
        },
        user: { // This correlates to the schemas we want to return
            type: UserType, // Here we are returning the UserType schema
            args: {id: { type: GraphQLString }}, // Here we define the argument the query will receive if we want to fetch the user with id of 12 etc
            resolve(parentValue, args){ // The actual function that fetches the data and receives the arguments
                return axios.get(`http://localhost:3000/users/${args.id}`).then(res => res.data) // Here we are search our users for the object with property-value pair {id: args.id}
            }
        },
        company: {
            type: CompanyType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue, args){
                return axios.get(`http://localhost:3000/companies/${args.id}`).then(res => res.data)
            }
        },
        position: {
            type: PositionType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue, args){
                return axios.get(`http://localhost:3000/positions/${args.id}`).then(res => res.data)
            }
        }
    }
})

// Define our Mutations to edit our data
const Mutations = new GraphQLObjectType({
    name: 'Mutations',
    fields: { // Here we list out our mutations
        addUser: {
            type: UserType, // Here we are manipulating or adding a UserType
            args: { // The properties being added
                firstName: {type: new GraphQLNonNull(GraphQLString)},
                lastName: {type: new GraphQLNonNull(GraphQLString)},
                age: {type: new GraphQLNonNull(GraphQLInt)},
                companyId: {type: GraphQLString},
                positionId: {type: GraphQLString}
            },
            resolve(parentValue, args){
                // If we want to add to users we must use the RESTful way: axios.post('.../users', {data})
                return axios.post('http://localhost:3000/users', {...args}).then(res => res.data)
            }
        },
        deleteUser: {
            type: UserType,
            args: { // The argument we need to delete the user namely the id: to find the user and delete
                id: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parentValue, {id}){
                return axios.delete(`http://localhost:3000/users/${id}`)
                    .then(res => res.data)
                    .catch(err => {
                        if(err.response) return err
                    })
            }
        },
        editUser: {
            type: UserType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)}, 
                firstName: {type: GraphQLString},
                lastName: {type: GraphQLString},
                age: {type: GraphQLInt},
                companyId: {type: GraphQLString},
                positionId: {type: GraphQLString}
            },
            resolve(parentValue, args){
                return axios.patch(`http://localhost:3000/users/${args.id}`, {...args}).then(res => res.data)
            }
        }
    }
})


// Export the RootQuery that when used appropriately will give us the different schemas defined in it
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutations
})


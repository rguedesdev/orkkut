import UserService from "./service.js";

// Resolver do GraphQL Separado
const userResolvers: any = {
  Query: {
    me: (_: any, __: any, context: any) => UserService.checkUser(context),
    user: (_: any, { id }: any) => UserService.getUserById(id),
  },
  Mutation: {
    signUp: (_: any, { data, confirmPassword }: any) =>
      UserService.signUp({ ...data, confirmPassword }),

    signIn: (_: any, { data }: any) => UserService.signIn(data),
  },
};

export { userResolvers };

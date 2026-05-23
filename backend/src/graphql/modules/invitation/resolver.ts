import InvitationService from "./service.js";

const invitationResolvers: any = {
  Mutation: {
    createInvitation: (_: any, __: any, context: any) =>
      InvitationService.createInvitation(context.user?.id),
  },
};

export { invitationResolvers };

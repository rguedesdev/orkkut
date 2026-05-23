class CommunityValidation {
  static createCommunity(data: any) {
    if (!data.name) throw new Error("O nome da comunidade é obrigatório!");

    if (!data.description)
      throw new Error("A descrição da comunidade é obrigatória!");

    if (!data.category)
      throw new Error("A categoria da comunidade é obrigatória!");

    if (!data.privacy)
      throw new Error("A privacidade da comunidde é obrigatória!");

    if (!data.country) throw new Error("O país da comunidade é obrigatório!");

    if (!data.language)
      throw new Error("O idioma da comunidade é obrigatório!");
  }
}

export { CommunityValidation };

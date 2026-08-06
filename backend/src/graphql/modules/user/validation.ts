class UserValidation {
  static signUp(data: any) {
    if (!data.name) throw new Error("O nome é obrigatório!");

    if (!data.username) throw new Error("O nome de usuario é obrigatório!");

    if (!data.email) throw new Error("O email é obrigatório!");

    if (!data.password) throw new Error("A senha é obrigatória!");

    if (!data.confirmPassword)
      throw new Error("A confirmação da senha é obrigatória!");

    if (data.password !== data.confirmPassword)
      throw new Error("As senhas precisam ser iguais!");

    if (!data.invitation) throw new Error("O código de convite é obrigatório!");
  }

  static signIn(data: any) {
    if (!data.email) throw new Error("O email é obrigatório!");

    if (!data.password) throw new Error("A senha é obrigatória!");
  }
}

export { UserValidation };

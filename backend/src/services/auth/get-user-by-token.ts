// Imports principais
import jwt from "jsonwebtoken";

// Model de Usuário
import { UserModel } from "../../graphql/modules/user/model.js";

const getUserByToken = async (token: string): Promise<any> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    if (!decoded.id) return null;

    const user = await UserModel.findById(decoded.id)
      .select("-password")
      .lean();

    return user;
  } catch {
    return null;
  }
};

export { getUserByToken };

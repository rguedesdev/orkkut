import { PassionModel, SportModel } from "./model.js";

class CatalogService {
  static passions(search?: string) {
    const filter: Record<string, unknown> = { active: true };
    if (search?.trim()) filter.name = { $regex: search.trim(), $options: "i" };
    return PassionModel.find(filter).sort({ order: 1, name: 1 }).lean();
  }

  static sports(search?: string) {
    const filter: Record<string, unknown> = { active: true };
    if (search?.trim()) filter.name = { $regex: search.trim(), $options: "i" };
    return SportModel.find(filter).sort({ order: 1, name: 1 }).lean();
  }
}

export default CatalogService;

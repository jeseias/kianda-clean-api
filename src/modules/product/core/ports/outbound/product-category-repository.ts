import type { Repository } from "@/src/modules/shared/ports/outbound/repository";
import type { ProductCategory } from "../../domain/entities/product-category";

export type ProductCategoryRepository = Pick<
	Repository<ProductCategory.Model>,
	"create" | "update" | "delete" | "findById"
> & {
	findBySlug(slug: string): Promise<ProductCategory.Model | null>;
	findAll(params?: {
		page?: number;
		limit?: number;
		sort?: string;
		order?: string;
		search?: string;
	}): Promise<ProductCategory.Model[]>;
};

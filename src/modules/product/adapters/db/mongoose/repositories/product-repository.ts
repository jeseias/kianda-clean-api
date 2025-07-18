import type { FilterQuery } from "mongoose";
import type { Product } from "@/src/modules/product/core/domain/entities";
import type {
	ProductFilters,
	ProductRepository,
} from "@/src/modules/product/core/ports/outbound/product-repository";
import { type ProductDocument, ProductModel } from "../product-model";

export class MongooseProductRepository implements ProductRepository {
	async create(product: Product.Props): Promise<Product.Props> {
		const doc = await ProductModel.create({
			...product,
			slug: product.slug.toString(),
		});

		return this.toDomainProps(doc.toJSON());
	}

	async update(data: Partial<Product.Props>): Promise<Product.Props> {
		if (!data.id) {
			throw new Error("ID is required for update");
		}

		const doc = await ProductModel.findOneAndUpdate(
			{ id: data.id },
			{
				...data,
				...(data.slug && { slug: data.slug.toString() }),
			},
			{ new: true },
		);

		if (!doc) {
			throw new Error("Product not found");
		}

		return this.toDomainProps(doc.toJSON());
	}

	async delete(id: string): Promise<void> {
		await ProductModel.findOneAndDelete({ id });
	}

	async findById(id: string): Promise<Product.Props | null> {
		const doc = await ProductModel.findOne({ id });
		if (!doc) return null;

		return this.toDomainProps(doc.toJSON());
	}

	async findByOrganizationId(organizationId: string): Promise<Product.Props[]> {
		const docs = await ProductModel.find({ organizationId });
		return docs.map(this.toDomainProps);
	}

	async findBySlug(slug: string): Promise<Product.Props | null> {
		const doc = await ProductModel.findOne({ slug });
		if (!doc) return null;

		return this.toDomainProps(doc.toJSON());
	}

	async findBySku(
		sku: string,
		organizationId: string,
	): Promise<Product.Props | null> {
		const doc = await ProductModel.findOne({ sku, organizationId });
		if (!doc) return null;

		return this.toDomainProps(doc.toJSON());
	}

	async findByBarcode(
		barcode: string,
		organizationId: string,
	): Promise<Product.Props | null> {
		const doc = await ProductModel.findOne({ barcode, organizationId });
		if (!doc) return null;

		return this.toDomainProps(doc.toJSON());
	}

	async findByCategoryId(categoryId: string): Promise<Product.Props[]> {
		const docs = await ProductModel.find({ categoryId });
		return docs.map(this.toDomainProps);
	}

	async findByProductTypeId(productTypeId: string): Promise<Product.Props[]> {
		const docs = await ProductModel.find({ productTypeId });
		return docs.map(this.toDomainProps);
	}

	async findByOrganizationIdAndCategoryId(
		organizationId: string,
		categoryId: string,
	): Promise<Product.Props[]> {
		const docs = await ProductModel.find({ organizationId, categoryId });
		return docs.map(this.toDomainProps);
	}

	async findByOrganizationIdAndProductTypeId(
		organizationId: string,
		productTypeId: string,
	): Promise<Product.Props[]> {
		const docs = await ProductModel.find({ organizationId, productTypeId });
		return docs.map(this.toDomainProps);
	}

	async findByOrganizationIdWithFilters(
		organizationId: string,
		filters: ProductFilters.Filters,
	): Promise<{ items: Product.Props[]; totalItems: number }> {
		const {
			categoryId,
			productTypeId,
			status,
			search,
			hasSku,
			hasBarcode,
			hasImage,
			createdAfter,
			createdBefore,
			updatedAfter,
			updatedBefore,
			limit,
			offset,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = filters;

		const query: FilterQuery<Product.Props> = { organizationId };

		if (categoryId) {
			query.categoryId = categoryId;
		}
		if (productTypeId) {
			query.productTypeId = productTypeId;
		}
		if (status) {
			query.status = status;
		}

		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		if (hasSku !== undefined) {
			if (hasSku) {
				query.sku = { $exists: true, $ne: null };
				(query as any).$and = query.$and || [];
				(query as any).$and.push({ sku: { $ne: "" } });
			} else {
				query.sku = { $exists: false };
			}
		}
		if (hasBarcode !== undefined) {
			if (hasBarcode) {
				query.barcode = { $exists: true, $ne: null };
				(query as any).$and = query.$and || [];
				(query as any).$and.push({ barcode: { $ne: "" } });
			} else {
				query.barcode = { $exists: false };
			}
		}
		if (hasImage !== undefined) {
			if (hasImage) {
				query.imageUrl = { $exists: true, $ne: null };
				(query as any).$and = query.$and || [];
				(query as any).$and.push({ imageUrl: { $ne: "" } });
			} else {
				query.imageUrl = { $exists: false };
			}
		}

		if (createdAfter || createdBefore) {
			const createdAtFilter: any = {};
			if (createdAfter) {
				createdAtFilter.$gte = createdAfter;
			}
			if (createdBefore) {
				createdAtFilter.$lte = createdBefore;
			}
			query.createdAt = createdAtFilter;
		}
		if (updatedAfter || updatedBefore) {
			const updatedAtFilter: any = {};
			if (updatedAfter) {
				updatedAtFilter.$gte = updatedAfter;
			}
			if (updatedBefore) {
				updatedAtFilter.$lte = updatedBefore;
			}
			query.updatedAt = updatedAtFilter;
		}

		const sort: Record<string, 1 | -1> = {};
		sort[sortBy] = sortOrder === "asc" ? 1 : -1;

		let queryBuilder = ProductModel.find(query).sort(sort);

		if (offset) {
			queryBuilder = queryBuilder.skip(offset);
		}
		if (limit) {
			queryBuilder = queryBuilder.limit(limit);
		}

		const docs = await queryBuilder.exec();

		const totalItems = await ProductModel.countDocuments(query);

		const items = docs.map(this.toDomainProps);

		return {
			items,
			totalItems,
		};
	}

	private toDomainProps(doc: ProductDocument): Product.Props {
		return {
			id: doc.id,
			name: doc.name,
			slug: doc.slug,
			description: doc.description,
			categoryId: doc.categoryId,
			productTypeId: doc.productTypeId,
			status: doc.status as Product.Status,
			organizationId: doc.organizationId,
			createdById: doc.createdById,
			imageUrl: doc.imageUrl,
			sku: doc.sku,
			barcode: doc.barcode,
			weight: doc.weight,
			dimensions: doc.dimensions,
			meta: doc.meta,
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt,
		};
	}
}

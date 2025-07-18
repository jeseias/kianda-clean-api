import type { Repository } from "@/src/modules/shared/ports/outbound/repository";
import type { Organization } from "../../domain/entities/organization";

export type OrganizationRepository = Pick<
	Repository<Organization.Props>,
	"create" | "update" | "delete" | "findById"
> & {
	findByOwnerId(ownerId: string): Promise<Organization.Props[]>;
};

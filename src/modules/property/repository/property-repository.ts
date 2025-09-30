import { Prisma, Property } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";
import { ApiError } from "../../../shared/utils/api-error";
import { CreatePropertyDTO } from "../dto/property-dto";

export class PropertyRepository {
  public async create(data: Prisma.PropertyCreateInput): Promise<Property> {
    return prisma.property.create({
      data,
    });
  }

  public async createWithTx(
    tx: Prisma.TransactionClient,
    data: Prisma.PropertyCreateInput
  ) {
    return tx.property.create({
      data,
    });
  }

  public async findById(id: number) {
    return prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: { images: true, rooms: { include: { availability: true } } },
    });
  }

  public async findBySlug(slug: string) {
    return prisma.property.findFirst({
      where: { slug, deletedAt: null },
      include: { images: true, rooms: { include: { availability: true } } },
    });
  }

  public async search(params: {
    city?: string | null;
    category?: string | null;
    q?: string | null;
    skip?: number;
    take?: number;
    sort?: string | null;
    publishedOnly?: boolean;
  }) {
    const where: any = { deletedAt: null };
    if (params.publishedOnly) where.published = true;
    if (params.city) where.city = { equals: params.city };
    if (params.category) where.category = params.category;
    if (params.q) where.name = { contains: params.q, mode: "insensitive" };

    const orderBy =
      params.sort === "name_asc"
        ? { name: "asc" }
        : params.sort === "name_desc"
        ? { name: "desc" }
        : undefined;

    const findManyArgs: any = {
      where,
      skip: params.skip,
      take: params.take,
      include: { rooms: true, images: true },
    };

    if (orderBy) {
      findManyArgs.orderBy = orderBy;
    }

    return prisma.property.findMany(findManyArgs) as Promise<
      Prisma.PropertyGetPayload<{ include: { rooms: true; images: true } }>[]
    >;
  }

  public async count(params: {
    city?: string | null;
    category?: string | null;
    q?: string | null;
    publishedOnly?: boolean;
  }) {
    const where: any = { deletedAt: null };
    if (params.publishedOnly) where.published = true;
    if (params.city) where.city = { equals: params.city };
    if (params.category) where.category = { equals: params.category };
    if (params.q) where.name = { contains: params.q, mode: "insensitive" };
    return prisma.property.count({ where });
  }

  public async update(id: number, data: Partial<Prisma.PropertyCreateInput>) {
    return prisma.property.update({ where: { id }, data });
  }

  public async softDelete(id: number) {
    return prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async findByTenant(tenantId: number) {
    return prisma.property.findMany({
      where: { tenantId, deletedAt: null },
      include: { rooms: true, images: true },
    });
  }
}

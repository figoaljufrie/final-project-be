import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../../shared/utils/prisma";
import {
  PropertyCreateRepoDto,
  PropertyListItemDto,
  PropertySearchRepoParamsDto,
  PropertyUpdateRepoDto,
} from "../dto/property-dto";

export class PropertyRepository {
  public async create(data: PropertyCreateRepoDto) {
    return prisma.property.create({
      data: data as Prisma.PropertyCreateInput,
      include: { images: true },
    });
  }

  public async findById(id: number) {
    return prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });
  }

  public async findByIdWithRooms(id: number) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        rooms: {
          where: { deletedAt: null },
          include: { images: true },
        },
        images: true,
      },
    });
  }

  public async findByTenant(tenantId: number) {
    return prisma.property.findMany({
      where: {
        tenantId,
        deletedAt: null,
        rooms: { some: { deletedAt: null } },
      },
      include: { rooms: true },
    });
  }

  public async update(id: number, data: Partial<PropertyUpdateRepoDto>) {
    return prisma.property.update({
      where: { id },
      data: data as Partial<Prisma.PropertyUpdateInput>,
    });
  }

  public async softDelete(id: number) {
    return prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async findManyForSearch(
    params: PropertySearchRepoParamsDto
  ): Promise<PropertyListItemDto[]> {
    let orderBy: Prisma.PropertyOrderByWithRelationInput;

    if (params.sortBy === "name") {
      orderBy = { name: params.sortOrder || "asc" };
    } else {
      orderBy = { createdAt: params.sortOrder || "desc" };
    }

    const properties = await prisma.property.findMany({
      where: params.whereClause,
      skip: params.skip,
      take: params.take,
      include: {
        rooms: {
          where: { deletedAt: null },
          select: { id: true, basePrice: true },
          orderBy: { basePrice: "asc" },
          take: 1,
        },
        images: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
      orderBy,
    });

    const result: PropertyListItemDto[] = properties.map((prop) => {
      const minBasePrice = prop.rooms[0]?.basePrice ?? null;
      const { rooms, ...rest } = prop;

      return {
        ...rest,
        minBasePrice,
        rooms: rooms,
      } as PropertyListItemDto;
    });

    return result;
  }

  public async count(whereClause: Prisma.PropertyWhereInput): Promise<number> {
    return prisma.property.count({ where: whereClause });
  }

  public async findMany(params: { where: any; include?: any; take?: number }) {
    return prisma.property.findMany(params);
  }
}

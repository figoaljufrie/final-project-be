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
      },
      include: {
        rooms: {
          where: { deletedAt: null },
        },
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
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

    // ✅ Fetch all fields including location data
    const properties = await prisma.property.findMany({
      where: params.whereClause,
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        city: true,
        province: true,
        latitude: true,
        longitude: true,
        published: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        rooms: {
          where: { deletedAt: null },
          select: { id: true, basePrice: true },
          orderBy: { basePrice: "asc" },
          take: 1,
        },
        images: {
          select: {
            url: true,
            altText: true,
            isPrimary: true,
            order: true,
            publicId: true,
          },
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        },
      },
      orderBy,
    });

    // ✅ Map to PropertyListItemDto
    const result: PropertyListItemDto[] = properties.map((prop) => {
      const minBasePrice = prop.rooms[0]?.basePrice ?? null;
      const { rooms, images, ...rest } = prop;

      return {
        ...rest,
        minBasePrice,
        avgRating: null, // Calculate this if you have reviews
        rooms: rooms,
        images: images,
      } as PropertyListItemDto;
    });

    return result;
  }

  public async count(whereClause: Prisma.PropertyWhereInput): Promise<number> {
    return prisma.property.count({ where: whereClause });
  }

  public async findMany(params: {
    where: any;
    include?: any;
    take?: number;
    select?: any;
  }) {
    return prisma.property.findMany(params);
  }

  
}

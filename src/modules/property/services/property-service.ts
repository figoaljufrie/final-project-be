import { PeakSeasonRepository } from "../../peak-season/repository/peakseason-repository";
import { Roomrepository } from "../../room/repository/room-repository";
import { PropertyRepository } from "../repository/property-repository";
import { AvailabilityRepository } from "../../availability/repository/availability-repository";
import { ApiError } from "../../../shared/utils/api-error";
import { prisma } from "../../../shared/utils/prisma";
import { CreatePropertyDTO } from "../dto/property-dto";
import paginate from "../../../shared/helpers/pagination";
import { computeRoomPrice } from "../../../shared/helpers/price-calc";
import { Room, Property, PropertyCategory } from "../../../generated/prisma";

export class PropertyService {
  private roomRepository = new Roomrepository();
  private availabilityRepository = new AvailabilityRepository();
  private peakSeasonRepository = new PeakSeasonRepository();
  private propertyRepository = new PropertyRepository();

  public async createProperty(tenantId: number, payload: CreatePropertyDTO) {
    if (!payload.name) throw new ApiError("Property name is required", 400);
    if (!payload.category)
      throw new ApiError("Property category is required", 400);

    const created = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          tenantId,
          category: payload.category,
          name: payload.name,
          slug:
            payload.slug ??
            `${payload.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          description: payload.description ?? null,
          address: payload.address ?? null,
          city: payload.city ?? null,
          province: payload.province ?? null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          published: payload.published ?? false,
          ...(payload.images && payload.images.length > 0
            ? {
                images: {
                  create: payload.images.map((img) => ({
                    url: img.url,
                    altText: img.altText ?? null,
                    isPrimary: !!img.isPrimary,
                  })),
                },
              }
            : {}),
        },
      });

      if (payload.rooms && payload.rooms.length) {
        for (const r of payload.rooms) {
          const room = await tx.room.create({
            data: {
              propertyId: property.id,
              name: r.name,
              capacity: r.capacity,
              basePrice: r.basePrice,
              description: r.description ?? null,
              totalUnits: r.totalUnits ?? 1,
            },
          });

          if (r.availability && r.availability.length) {
            for (const av of r.availability) {
              await tx.roomAvailability.create({
                data: {
                  roomId: room.id,
                  date: new Date(av.date),
                  isAvailable:
                    typeof av.isAvailable === "boolean" ? av.isAvailable : true,
                  customPrice:
                    typeof av.customPrice === "number" ? av.customPrice : null,
                  priceModifier:
                    typeof av.priceModifier === "number"
                      ? av.priceModifier
                      : null,
                  reason: av.reason ?? null,
                },
              });
            }
          }
        }
      }
      return tx.property.findUnique({
        where: { id: property.id },
        include: { images: true, rooms: { include: { availability: true } } },
      });
    });
    return created;
  }

  public async updateProperty(
    tenantId: number,
    propertyId: number,
    data: Partial<any>
  ) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) throw new ApiError("Property not found", 404);
    if (property.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);

    return this.propertyRepository.update(propertyId, data);
  }

  public async publishProperty(
    tenantId: number,
    propertyId: number,
    publish: boolean
  ) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) throw new ApiError("Property not found", 404);
    if (property.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);

    return this.propertyRepository.update(propertyId, { published: publish });
  }

  public async deleteProperty(tenantId: number, propertyId: number) {
    const property = await this.propertyRepository.softDelete(propertyId);

    if (!property) throw new ApiError("Property not found", 404);
    if (property.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);

    return this.propertyRepository.softDelete(propertyId);
  }

  public async getPropertyById(id: number, dateForPrices?: string | null) {
    const property = await this.propertyRepository.findById(id);
    if (!property) throw new ApiError("Property not found", 404);

    if (dateForPrices) {
      const targetDate = new Date(dateForPrices);
      const peakSeasons =
        await this.peakSeasonRepository.findActiveForPropertyDate(
          id,
          targetDate
        );

      const rooms = await Promise.all(
        property.rooms.map(async (r) => {
          const avail = await this.availabilityRepository.findByRoomAndDate(
            r.id,
            targetDate
          );
          const { available, price } = computeRoomPrice(
            r.basePrice,
            avail,
            peakSeasons
          );
          return { ...r, _available: available, _price: price };
        })
      );
      return { ...property, rooms };
    }
    return property;
  }

  async search(params: {
    city?: string;
    category?: string;
    q?: string;
    page?: number;
    limit?: number;
    sort?: string;
    start?: string | null;
    end?: string | null;
  }) {
    const { page, limit, skip } = paginate(params.page, params.limit);
    const properties = await this.propertyRepository.search({
      city: params.city ?? null,
      category: params.category ?? null,
      q: params.q ?? null,
      skip,
      take: limit,
      sort: params.sort ?? null,
      publishedOnly: true,
    });

    const total = await this.propertyRepository.count({
      city: params.city ?? null,
      category: params.category ?? null,
      q: params.q ?? null,
      publishedOnly: true,
    });

    const items = await Promise.all(
      properties.map(async (p) => {
        if (!params.start) {
          // find minimal base price among rooms
          const minBase = p.rooms.reduce(
            (acc: number, r: Room) => Math.min(acc, r.basePrice),
            Number.MAX_SAFE_INTEGER
          );
          return {
            ...p,
            minPrice: minBase === Number.MAX_SAFE_INTEGER ? null : minBase,
          };
        } else {
          const targetDate = new Date(params.start!);
          const peakSeasons =
            await this.peakSeasonRepository.findActiveForPropertyDate(
              p.id,
              targetDate
            );

          // compute min price among rooms that are available
          const roomPrices = await Promise.all(
            p.rooms.map(async (r: Room) => {
              const avail = await this.availabilityRepository.findByRoomAndDate(
                r.id,
                targetDate
              );
              const { available, price } = computeRoomPrice(
                r.basePrice,
                avail,
                peakSeasons
              );
              return available ? price : null;
            })
          );

          const validPrices = roomPrices.filter(
            (x) => typeof x === "number"
          ) as number[];
          const minPrice = validPrices.length ? Math.min(...validPrices) : null;
          return { ...p, minPrice };
        }
      })
    );

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  public async listTenantProperties(tenantId: number) {
    return this.propertyRepository.findByTenant(tenantId);
  }
}

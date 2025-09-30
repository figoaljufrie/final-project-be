export default function paginate(
  page: number | undefined,
  limit: number | undefined
) {
  const _page = page && page > 0 ? page : 1;
  const _limit = limit && limit > 0 ? limit : 10;
  const skip = (_page - 1) * _limit;
  return { page: _page, limit: _limit, skip };
}
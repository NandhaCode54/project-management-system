function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number.parseInt(String(query.page), 10);
  const limit = query.limit === undefined ? 10 : Number.parseInt(String(query.limit), 10);

  const pageNum = Number.isInteger(page) && page >= 1 ? page : 1;
  const limitNum = Number.isInteger(limit) && limit >= 1 && limit <= 100 ? limit : 10;

  return { page: pageNum, limit: limitNum, skip: (pageNum - 1) * limitNum };
}

function paginate(data, page, limit, total) {
  return {
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { parsePagination, paginate };
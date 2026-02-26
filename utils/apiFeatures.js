class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.query = mongooseQuery; // cleaner naming
        this.queryString = queryString;
        this.paginationResult = {};
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ["page", "sort", "limit", "fields", "keyword"];
        excludedFields.forEach((field) => delete queryObj[field]);

        // Advanced filtering: gte, gt, lte, lt, in
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt|in)\b/g,
            (match) => `$${match}`,
        );

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort("-createdAt");
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select("-__v");
        }
        return this;
    }

    search(searchFields = []) {
        if (this.queryString.keyword && searchFields.length > 0) {
            const keyword = this.queryString.keyword;

            const query = {
                $or: searchFields.map((field) => ({
                    [field]: { $regex: keyword, $options: "i" },
                })),
            };

            this.query = this.query.find(query);
        }

        return this;
    }

    async paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const totalDocuments = await this.query.clone().countDocuments();

        const numberOfPages = Math.ceil(totalDocuments / limit);

        this.query = this.query.skip(skip).limit(limit);

        this.paginationResult = {
            currentPage: page,
            limit,
            numberOfPages,
            totalDocuments,
            ...(page < numberOfPages && { nextPage: page + 1 }),
            ...(page > 1 && { prevPage: page - 1 }),
        };

        return this;
    }
}

export default ApiFeatures;

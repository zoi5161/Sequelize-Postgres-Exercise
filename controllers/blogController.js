const controller = {}
const models = require('../models');
const { Op } = require('sequelize');

controller.init = async (req, res, next) => {
    res.locals.categories = await models.Category.findAll({
        include: [{ model: models.Blog }],
    });
    res.locals.tags = await models.Tag.findAll();
    next();
}

controller.showList = async (req, res) => {
    let limit = 2;
    let { category = 0, tag = 0, keyword = "", page = 1 } = req.query;
    category = isNaN(category) ? 0 : parseInt(category);
    tag = isNaN(tag) ? 0 : parseInt(tag);
    page = isNaN(page) ? 1 : parseInt(page);
    let offset = (page - 1) * limit;

    let options = {
        include: [{ model: models.Comment }],
        where: {},
    };

    // Nếu người dùng có chọn category thì lọc blog theo category
    if(category) {
        options.where.categoryId = category;
    }

    // Nếu người dùng có chọn tag thì lọc blog theo tag
    if(tag){
        options.include.push({ model: models.Tag, where: { id: tag }});
    }

    // Nếu người dùng có nhập keyword thì lọc blog theo keyword
    if(keyword.trim() != ""){
        options.where[Op.or] = {
            title: { [Op.iLike]: `%${keyword.trim()}%`},
            summary: { [Op.iLike]: `%${keyword.trim()}%`},
        };
    }

    // Đếm có bao nhiêu blog thoả điều kiện
    let totalRows = await models.Blog.count({
        ...options, 
        distinct: true,
        col: 'id'
    });
    res.locals.pagination = {
        page,
        limit,
        totalRows,
        queryParams: req.query,
    };

    let blogs = await models.Blog.findAll({ ...options, limit, offset });
    res.locals.blogs = blogs;
    res.render("index");
};

controller.showDetails = async (req, res) => {
    let id = isNaN(req.params.id) ? 0 : parseInt(req.params.id);
    res.locals.blog = await models.Blog.findOne({
        where: { id },
        include: [
            { model: models.Comment },
            { model: models.User },
            { model: models.Category },
            { model: models.Tag },
        ]
    })
    res.render("details");
};

module.exports = controller;
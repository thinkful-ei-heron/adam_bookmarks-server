const BookmarksService = {
    getAllBookmarks(knex) {
       return knex.select('*').from('bookmarks_items')
    },
    insertBookmark(knex, newBookmark) {
        return knex.insert(newBookmark).into('bookmarks_items').returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('bookmarks_items').select('*').where('id', id).first()
    },
    deleteBookmark(knex, id) {
        return knex('bookmarks_items').where({ id }).delete()
    },
    updateBookmark(knex, id, newBookmarksFields) {
        return knex('bookmarks_items')
            .where({ id })
            .update(newBookmarksFields)
    }
}

module.exports = BookmarksService;
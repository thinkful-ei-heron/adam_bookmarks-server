const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const BookmarksService = require('../bookmarks-service')

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating
})

bookmarksRouter.route('/bookmarks')
    .get(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks)
            })
            .catch(next)
    })

    .post((req, res, next) => {
        const { title, url, description, rating } = req.body
        const newBookmark = { title, url, description, rating }
        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }
        BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created`)
                res.status(201).location(`/bookmarks/${bookmark.id}`).json(bookmark)
            })
            .catch(next)
        
    })

bookmarksRouter.route('/bookmarks/:bookmark_id')
    .all((req, res, next) => {
        BookmarksService.getById(req.app.get('db'), req.params.bookmark_id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.bookmark = bookmark
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeBookmark(res.bookmark))
    })

    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(req.app.get('db'), req.params.bookmark_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter;
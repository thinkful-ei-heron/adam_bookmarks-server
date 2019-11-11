const path = require('path')
const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const BookmarksService = require('../bookmarks-service')

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating)
})

bookmarksRouter.route('/')
    .get(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })

    .post(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const newBookmark = { title, url, description, rating }
        for (const field of ['title', 'url', 'rating']) {
            if (!newBookmark[field]) {
                logger.error(`${field} is required`)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }
        BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created`)
                res.status(201).location(path.posix.join(req.originalUrl, `${bookmark.id}`)).json(serializeBookmark(bookmark))
            })
            .catch(next)
        
    })

bookmarksRouter.route('/:bookmark_id')
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

    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating }
        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: { message: `Request body must contain either 'title', 'url', 'description' or 'rating'`}
            })
        }
        BookmarksService.updateBookmark(req.app.get('db'), req.params.bookmark_id, bookmarkToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter;
const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeItemsArray } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks_items').truncate())

    afterEach('cleanup', () => db('bookmarks_items').truncate())

    describe(`Get /bookmarks`, () => {
        context(`Given no items`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
        })
        context(`Given there are items in the database`, () => {
            const testItems = makeItemsArray()

            beforeEach('insert items', () => {
                return db.into('bookmarks_items').insert(testItems)
            })

            it(`GET /bookmarks responds with 200 and all of the bookmarks`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testItems)
            })
        })
    })

    describe(`GET /bookmarks/:bookmark_id`, () => {
        context(`Given no items`, () => {
            it(`responds with 404`, () => {
                const itemId = 123456
                return supertest(app)
                    .get(`/articles/${itemId}`)
                    .expect(404, {
                        error: { message: `Bookmark doesn't exist` }
                    })
            })
        })
        context(`Given there are items in the database`, () => {
            const testItems = makeItemsArray()

            beforeEach(`insert items`, () => {
                return db.into('bookmarks_items').insert(testItems)
            })

            it(`GET /bookmarks/:bookmark_id responds with 200 and the specified item`, () => {
                const bookmarkId = 3
                const expectedItem = testItems[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expectedItem)
            })
        })
    })

    describe(`POST /bookmarks`, () => {
        it(`creates a bookmark item, responding with 201 and the new bookmark`, () => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'http://www.testnewbookmark.com',
                description: 'Test new bookmark description',
                rating: 3
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })
        const requiredFields = ['title', 'url', 'rating']
        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'http://www.testnewbookmark.com',
                description: 'Test new bookmark description',
                rating: 3
            }
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBookmark[field]
                return supertest(app)
                    .post('/bookmarks')
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe.only(`DELETE /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeItemsArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_items')
                    .insert(testBookmarks)
            })

            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/bookmarks`)
                            .expect(expectedBookmarks)
                    )
            })
        })
    })
})
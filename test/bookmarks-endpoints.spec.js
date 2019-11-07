const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeItemsArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {
    let db 

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
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
                    .get(`/articles/${articleId}`)
                    .expect(404, { error: { message: `Article doesn't exist` } })
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
})
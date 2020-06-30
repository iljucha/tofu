// @ts-check
import Context from "./context.js"

/**
 * @typedef {(ctx: Context, next?: () => void) => void} Handler
 */

export default class Route {
    /** @type {string[]} */
    #parameters
    /** @type {RegExp} */
    #regExp
    /** @type {string} */
    #method
    /** @type {Handler} */
    #handler
    /** @type {string} */
    #route

    /**
     * @param {string} method
     * @param {string} route
     * @param {Handler} handler
     */
    constructor(method, route, handler) {
        this.#parameters = Route.parameters(route)
        this.#regExp = Route.regExp(route)
        this.#method = method
        this.#route = route
        this.#handler = handler
    }

    /**
     * @param {string} method - IncomingMessage method
     * @param {string} url - IncomingMessage url
     */
    match(method, url) {
        if (this.route === "/*") {
            return true
        }
        let match = this.params(url)
        if (Object.keys(match).length !== this.parameters.length) {
            return false
        }
        if (match && (this.method === method || this.method === "ANY")) {
            return true
        }
        else {
            return false
        }
    }

    /**
     * @param {string} url
     * @returns {any}
     */
    params(url) {
        url = url.split("?")[0] || url
        let match = this.regExp.exec(url)
        
        if (match) {
            if (match.groups) {
                return { ...match.groups }
            }
            else {
                return { }
            }
        }
        else {
            return false
        }
    }

    /**
     * @type {RegExp}
     */
    get regExp() {
        return this.#regExp
    }

    get method() {
        return this.#method
    }

    get handler() {
        return this.#handler
    }

    get route() {
        return this.#route
    }

    /**
     * @type {string[]}
     */
    get parameters() {
        return this.#parameters
    }

    /**
     * @param {string} value
     * @returns {string[]}
     */
    static parameters(value) {
        let params = value.match(/\:([a-zA-Z]+)/gi)
        if (params) {
            params = params.map(param => param.replace(/:/, ""))
        }
        else {
            params = []
        }
        return params
    }

    /**
     * @param {string} value
     * @returns {RegExp}
     * @example
     * Route.regExp = "/user/:alias" // /^\/user\/(?<alias>[^\/\:\?]+?)\/?$/
     */
    static regExp(value) {
        value = value.replace(/\:([a-zA-Z]+)/gi, "(?<$1>[^\\/\\:\\?]+?)")
        return new RegExp("^" + value + "/?$")
    }
}
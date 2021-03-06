// @ts-check
import Route from "@iljucha/route"
import fs from "fs"
import child from "child_process"
import Context from "../context.js"

/**
 * @typedef {(context: Context, next: () => Promise) => Promise} Plugin
 * @typedef {Route & { handler: Plugin }} PluginHandler
 */

const isText = /^text\/|^application\/(javascript|json|html|plain|css)/

/**
 * @param {string} path
 * @param {Context} ctx 
 * @param {() => void} next 
 */
export default async function serve(path, ctx, next) {
    const filename = path + ctx.cleanUrl
    file(filename, ctx, next)
}

/**
 * @param {string} filename
 * @param {Context} ctx 
 * @param {() => void} errorCallback 
 */
export function file(filename, ctx, errorCallback) {
    let mtime, output, charset

    fs.stat(filename, (err, stat) => {
        if (!stat || !stat.isFile() || err) {
            return errorCallback()
        }
        mtime = new Date(stat.mtimeMs).toUTCString()
        if (ctx.headers["if-modified-since"] === mtime) {
            ctx.status = 304
            ctx.cache = "public"
            return ctx.body = ""
        }
        child.exec(`xdg-mime query filetype '${filename}'`, (err, stdout, stderr) => {
            if ((err || stderr) || !stdout) {
                return errorCallback()
            }
            output = stdout.replace(/\n/gm, "")
            charset = isText.test(output) ? "utf-8" : false
            // @ts-ignore
            fs.readFile(filename, { encoding: charset }, (err, data) => {
                if (err) {
                    return errorCallback()
                }
                ctx.status = 200
                ctx.length = stat.size
                ctx.cache = "public"
                ctx.headers = { "Last-Modified": mtime }
                ctx.type = output + (charset ? "; charset=" + charset : "")
                ctx.body = data
            })
        })
    })
}
import fs from "fs"
import child from "child_process"
import Context from "@iljucha/tofu/context.js"

const isText = /^text\/|^application\/(javascript|json|html|plain|css)/

/**
 * @param {string} path
 * @param {Context} ctx 
 * @param {() => void} next 
 */
export default function serve(path, ctx, next) {
    const filename = path + ctx.cleanUrl
    let mtime, output, charset
    fs.stat(filename, (err, stat) => {
        if (!stat || !stat.isFile() || err) {
            return next()
        }
        mtime = new Date(stat.mtimeMs).toUTCString()
        if (ctx.headers["if-modified-since"] === mtime) {
            ctx.status = 304
            ctx.cache = "public"
            return ctx.end = true
        }
        child.exec(`xdg-mime query filetype '${filename}'`, (err, stdout, stderr) => {
            if ((err || stderr) || !stdout) {
                return next()
            }
            output = stdout.replace(/\n/gm, "")
            charset = isText.test(output) ? "utf-8" : false
            // @ts-ignore
            fs.readFile(filename, { encoding: charset }, (err, data) => {
                if (err) {
                    return next()
                }
                ctx.status = 200
                ctx.length = stat.size
                ctx.cache = "public"
                ctx.header = { "Last-Modified": mtime }
                ctx.type = output + (charset ? "; charset=" + charset : "")
                ctx.charset = charset
                ctx.body = data
                //ctx.end = true
            })
        })
    })
}
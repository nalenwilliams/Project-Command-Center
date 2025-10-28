import fs from 'fs/promises'
import path from 'path'
import Handlebars from 'handlebars'
import MarkdownIt from 'markdown-it'
import puppeteer from 'puppeteer'
const md = new MarkdownIt()
export async function renderTemplate(name, data) {
  const templatePath = path.join(process.cwd(), 'server', 'templates', name)
  const tpl = await fs.readFile(templatePath, 'utf8')
  const compile = Handlebars.compile(tpl)
  return compile(data)
}
export async function renderProposalHTML(data) {
  const templatePath = path.join(process.cwd(), 'server', 'templates', 'proposal.html')
  const tpl = await fs.readFile(templatePath, 'utf8')
  const compile = Handlebars.compile(tpl)
  return compile(data)
}
export async function htmlToPDF(html, outPath) {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.pdf({ path: outPath, format: 'Letter', printBackground: true })
  await browser.close()
}
export function mdToHtml(txt=''){ return md.render(txt) }

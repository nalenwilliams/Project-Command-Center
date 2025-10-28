import Handlebars from 'handlebars'
import MarkdownIt from 'markdown-it'
const md = new MarkdownIt()
export function renderTpl(tpl, data) {
  const compile = Handlebars.compile(tpl || '')
  return compile(data || {})
}
export function mdToHtml(text='') { return md.render(text) }

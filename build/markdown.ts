// Markdown pipeline: reads src/content/**/*.md, parses frontmatter with gray-matter,
// converts body to HTML with marked, computes reading time (Math.ceil(wordCount / 200)),
// filters draft:true in production. Exports ArticleMeta and ProjectMeta interfaces.
// build-specialist owns this file.

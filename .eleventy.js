module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/js/scripts/*.min.js')
  eleventyConfig.addPassthroughCopy('src/js/helpers')
  eleventyConfig.addPassthroughCopy('src/js/components')

  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
    templateFormats: ['html', 'md', 'njk'],
    passthroughFileCopy: true,
  }
}

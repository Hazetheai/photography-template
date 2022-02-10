module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/js/scripts/*.min.js');
  eleventyConfig.addPassthroughCopy('src/js/helpers');
  eleventyConfig.addPassthroughCopy('src/js/components');
  eleventyConfig.addPassthroughCopy('admin');
  eleventyConfig.addPassthroughCopy('src/_includes/assets/css/inline.css');
  eleventyConfig.addPassthroughCopy('favicon.ico');
  eleventyConfig.addPassthroughCopy('static/img');

  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
    templateFormats: ['html', 'md', 'njk'],
    passthroughFileCopy: true,
  };
};

import Photoshoot from '/admin/preview-templates/photoshoot.js';
import Page from '/admin/preview-templates/page.js';

// Register the Photoshoot component as the preview for entries in the gallery collection
CMS.registerPreviewTemplate('gallery', Photoshoot);
CMS.registerPreviewTemplate('pages', Page);

CMS.registerPreviewStyle('/_includes/assets/css/inline.css');
// Register any CSS file on the home page as a preview style
fetch('/')
  .then((response) => response.text())
  .then((html) => {
    const f = document.createElement('html');
    f.innerHTML = html;
    Array.from(f.getElementsByTagName('link')).forEach((tag) => {
      if (tag.rel == 'stylesheet' && !tag.media) {
        CMS.registerPreviewStyle(tag.href);
      }
    });
  });

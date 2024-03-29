(async () => {
  const rootEl = document.getElementById('wp-feed-app');
  const feedEl = document.getElementById('wp-feed-app_feed');
  const url = rootEl.getAttribute('data-url')?.replace(/\/$/, '') || '';

  if (!url) {
    return;
  }

  const getNumPosts = (breakpoint, defaultNumPosts = 3) => {
    return Number(
      rootEl.getAttribute(`data-num_posts_${breakpoint}`) ?? defaultNumPosts
    );
  };

  const numPosts = Math.max(
    getNumPosts('lg'),
    getNumPosts('md'),
    getNumPosts('sm')
  );

  const posts = await fetchPosts();
  const newFeedEl = renderFeed(feedEl, posts ?? []);

  feedEl.replaceWith(newFeedEl);

  async function fetchPosts() {
    return fetch(
      `${url}/wp-json/wp/v2/posts?_embed&_fields=title,link,excerpt,featured_media,_embedded,_links&order=desc&per_page=${numPosts}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    ).then((data) => data.json());
  }

  function renderFeed(targetElement, posts) {
    let template;

    function createNewArticleNode() {
      if (!template) {
        template = document.getElementById('wp-feed-app_article');
      }
      return template.content.firstElementChild.cloneNode(true);
    }

    function getPostElement(post) {
      const {
        link,
        title: { rendered: title },
        excerpt: { rendered: excerpt },
        featured_media: mediaId,
        _embedded: { 'wp:featuredmedia': allMedia },
      } = post;

      const media = allMedia.find((media) => media.id === mediaId);

      const el = createNewArticleNode();

      const imageLinkEl = el.querySelector('.wp-feed-app_article__image-link');
      if (imageLinkEl) {
        imageLinkEl.setAttribute('href', link);
      }

      const titleLinkEl = el.querySelector('.wp-feed-app_article__title-link');
      if (titleLinkEl) {
        titleLinkEl.setAttribute('href', link);
        titleLinkEl.innerHTML = title;
        titleLinkEl.innerHTML = titleLinkEl.textContent.trim();
      }

      const descriptionEl = el.querySelector(
        '.wp-feed-app_article__description'
      );
      if (descriptionEl) {
        descriptionEl.innerHTML = excerpt;
        descriptionEl.innerHTML = descriptionEl.textContent.trim();
      }

      const imageEl = el.querySelector('img');
      if (imageEl) {
        imageEl.setAttribute('src', media.source_url);
        imageEl.setAttribute('alt', media.alt_text);
        imageEl.setAttribute('width', '100%');
        imageEl.setAttribute('height', 'auto');
      }

      return el;
    }

    const feedEl = targetElement.cloneNode(true);

    feedEl.innerHTML = '';

    posts.map(getPostElement).forEach((element) => {
      feedEl.appendChild(element);
    });

    return feedEl;
  }
})();

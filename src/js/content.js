console.log('Commenter Subs');

/**
 * Returns the subscriber count string of a given youtube channel
 * @param {string} channelUrl the url of a given youtube channel
 *  Should be of the form *https://www.youtube.com/channel/<channel id>*
 */
const getSubs = async (channelUrl) => {
  const response = await fetch(channelUrl + '/about');
  const text = await response.text();

  // Get start and end index of subscriber count string
  const subStartIndex = 14 + text.indexOf(
    '"simpleText"',
    text.indexOf(
      '"subscriberCountText"',
      text.indexOf(
        '"c4TabbedHeaderRenderer"',
        text.indexOf('window["ytInitialData"]')
      )
    )
  );
  const subEndIndex = text.indexOf('"', subStartIndex);

  const subString = text.substring(subStartIndex, subEndIndex);
  return subString.split(' ')[0];
}


/**
 * Returns a promise which will resolve when a given child element has loaded
 * that satisfies a particular query selector.  
 * This function will return even if the element already exists before the
 * listener was created.
 * @param {HTMLElement} targetElement the element to listen from (the parent)
 * @param {string} query a css selector query for the desired element
 * @param {boolean} subtree whether to consider more than just direct children
 */
const onChildLoad = (targetElement, query, subtree=false) => {
  return new Promise(res => {
    // Check if element already exists in the targetElement
    const existingElement = targetElement.querySelector(
      (subtree ? ':scope > ' : '') + query
    );
    if (existingElement !== null) {
      res(existingElement);
      return;
    }

    // Otherwise create a listener on the targetElement
    const observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // Return first node which matches selector
          if (node.matches && node.matches(query)) {
            observer.disconnect();
            res(node);
          }
        })
      })
    })
    observer.observe(targetElement, {childList: true, subtree: subtree})
  })
}


// Wait until comment section loads contents div before creating comment listener
onChildLoad(document.querySelector('ytd-app'), 'ytd-item-section-renderer#sections', true)
  .then(targetNode => targetNode.querySelector('div#contents'))
  .then(targetNode => {
    // Listen for comments
    const observer = new MutationObserver((mutationsList) => {    
      mutationsList.forEach(mutation => {
        mutation.addedNodes.forEach(async el => {
          if (el.tagName !== 'YTD-COMMENT-THREAD-RENDERER') return;
          
          const commentHeaderElement = el.querySelector('div#header-author');

          // Remove any existing subscriber counts
          commentHeaderElement.querySelectorAll('.subscriber-count').forEach(el => {
            commentHeaderElement.removeChild(el);
          });

          const channelUrl = el.querySelector('div#author-thumbnail > a').href;
          const subs = await getSubs(channelUrl);

          // Add new subscriber count
          const subCounterSpan = document.createElement('span');
          commentHeaderElement.appendChild(subCounterSpan);
          subCounterSpan.className = 'subscriber-count';
          subCounterSpan.innerHTML = `${subs} subscriber${subs === '1' ? '' : 's'}`;
          subCounterSpan.style.fontSize = '1.1em';
          subCounterSpan.style.color = '#ddd';
          subCounterSpan.style.backgroundColor = '#333';
          subCounterSpan.style.marginLeft = '4px';
          subCounterSpan.style.padding = '1px 3px 1px 3px';
          subCounterSpan.style.borderRadius = '3px';
        })
      })
    });

    observer.observe(targetNode, {childList: true});
  })

(()=>{
  console.log('Commenter Subscribers for YouTube™');

  /**
   * Returns the subscriber count string of a given youtube channel.  
   * If subscriber count is private, "*Private*" is returned.
   * @param {string} channelUrl the url of a given youtube channel. 
   * Should be of the form *https://www.youtube.com/channel/<channel id>*
   */
  const getSubs = async (channelUrl) => {
    const response = await fetch(channelUrl + '/about');
    const text = await response.text();

    // Get start of subscriber count string
    let subStartIndex = text.indexOf(
      '"subscriberCountText"',
      text.indexOf(
        '"c4TabbedHeaderRenderer"',
        text.indexOf('window["ytInitialData"]')
      )
    );

    // User has set their subscriber count to private
    if (subStartIndex === -1) return '<i>Private</i>';
    
    subStartIndex = 14 + text.indexOf(
      '"simpleText"',
      subStartIndex
    );

    // Get end of subscriber string
    const subEndIndex = text.indexOf('"', subStartIndex);

    let subCount = text.substring(subStartIndex, subEndIndex).split(' ')[0];
    return `${subCount} subscriber${subCount === '1' ? '' : 's'}`;
  }


  /**
   * Adds the sub count to a given comment element.
   * If the comment already has a sub count, this is removed first.
   * @param {HTMLElement} commentElement the comment element <ytd-comment-renderer>
   */
  const addCommentSubCount = async commentElement => {
    const commentHeaderElement = commentElement.querySelector('div#header-author');

    // Remove any existing subscriber counts
    commentHeaderElement.querySelectorAll('.subscriber-count').forEach(el => {
      commentHeaderElement.removeChild(el);
    });

    const channelUrl = commentElement.querySelector('div#author-thumbnail > a').href;
    const subCount = await getSubs(channelUrl);

    // Add new subscriber count
    const subCounterSpan = document.createElement('span');
    commentHeaderElement.appendChild(subCounterSpan);
    subCounterSpan.className = 'subscriber-count';
    subCounterSpan.innerHTML = subCount;
    subCounterSpan.style.fontSize = '1.1rem';
    subCounterSpan.style.lineHeight = 'normal';
    subCounterSpan.style.color = '#ddd';
    subCounterSpan.style.backgroundColor = '#333';
    subCounterSpan.style.marginLeft = '4px';
    subCounterSpan.style.padding = '1px 3px 1px 3px';
    subCounterSpan.style.borderRadius = '3px';


    /*
      When navigating between videos, comment elements are not recreated and so
      addCommentSubCount is not triggered. This means the subscriber count will
      represent that of a channel from a previous video instead of the current.

      To fix this, we listen for changes to the href of the comment to trigger
      and update to the subscriber count.
    */
    const observer = new MutationObserver(mutationsList => {   
      mutationsList
        .filter(mutation => mutation.type === 'attributes' && mutation.attributeName === 'href')
        .forEach(async () => {
          // Hide element while we fetch new subscriber count
          subCounterSpan.style.visibility = 'hidden';
          const channelUrl = commentElement.querySelector('div#author-thumbnail > a').href;
          subCounterSpan.innerHTML = await getSubs(channelUrl);
          subCounterSpan.style.visibility = 'visible';
        })
    });

    observer.observe(
      commentElement.querySelector('div#author-thumbnail > a'),
      {childList: false, subtree: false, attributes: true}
    );

  }


  // Create an observer to listen for any new comment elements
  const observer = new MutationObserver((mutationsList) => {    
    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(el => {
        if (el.tagName !== 'YTD-COMMENT-THREAD-RENDERER') return;
        addCommentSubCount(el);
      })
    })
  });

  // Listen for comments on an element which always starts loaded
  observer.observe(
    document.querySelector('ytd-app'),
    {childList: true, subtree: true}
  );
})()

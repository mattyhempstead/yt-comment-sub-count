(()=>{
  console.log('Commenter Subscribers for YouTube™');

  /**
   * Returns the subscriber count string of a given youtube channel.  
   * If subscriber count is private, <i>Private</i> is returned.
   * @param {string} channelUrl the url of a given youtube channel. 
   * Should be of the form: https://www.youtube.com/channel/<channel id>
   */
  const getSubs = async (channelUrl) => {
    const response = await fetch(channelUrl + '/about');
    const text = await response.text();

    // Get subscriber count string.
    // The returned HTML contains a large JSON that has the sub count as
    // a rendered string in a field called "subscriberCountText".
    // e.g. ... "subscriberCountText":"12.4K subscribers" ...

    // We just do a regex to find it for now
    const regex = /"subscriberCountText":"([^"]+)"/;
    const match = text.match(regex);

    // User has set their subscriber count to private.
    // We detect this if the subscriberCountText field is missing.
    if (match === null) return '<i>Private</i>';

    // We now have a string like: "subscriberCountText":"2 subscribers"
    // with the count in match group 1, so return just that.
    return match[1];
  }


  /**
   * Adds the sub count to a given comment element.
   * If the comment already has a sub count, this is removed first.
   * @param {HTMLElement} commentElement an element which contains a single comment
   */
  const addCommentSubCount = async (commentElement) => {
    const channelUrlLookup = 'div#header-author a';
    const commentHeaderElement = commentElement.querySelector('div#header-author');

    // Remove any existing subscriber counts
    commentHeaderElement.querySelectorAll('.subscriber-count').forEach(el => {
      commentHeaderElement.removeChild(el);
    });

    const channelUrl = commentElement.querySelector(channelUrlLookup).href;
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
          const channelUrl = commentElement.querySelector(channelUrlLookup).href;
          subCounterSpan.innerHTML = await getSubs(channelUrl);
          subCounterSpan.style.visibility = 'visible';
        })
    });

    observer.observe(
      commentElement.querySelector(channelUrlLookup),
      {childList: false, subtree: false, attributes: true}
    );

  }


  // Create an observer to listen for any new comment elements
  const observer = new MutationObserver((mutationsList) => {    
    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(el => {
        // YTD-COMMENT-VIEW-MODEL appears to be a tag that wraps a single comment or reply
        if (el.tagName === 'YTD-COMMENT-VIEW-MODEL') {
          addCommentSubCount(el);
        }
      });
    });
  });

  // Listen for comments on an element which always starts loaded
  observer.observe(
    document.querySelector('ytd-app'),
    {childList: true, subtree: true}
  );
})()

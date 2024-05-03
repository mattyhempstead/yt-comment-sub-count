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

    // Get start of subscriber count string.
    // The returned HTML contains a large JSON that has the sub count as
    // a rendered string in a field called "subscriberCountText".
    // e.g. ... "subscriberCountText":"12.4K subscribers" ...

    // We just do a regex to find it for now
    const regex = /"subscriberCountText":"[a-zA-Z0-9.]+ subscribers"/;
    const match = text.match(regex);

    // User has set their subscriber count to private.
    // We detect this if the subscriberCountText field is missing.
    if (match === null) return '<i>Private</i>';

    // We now have a string like: "subscriberCountText":"2 subscribers"
    // We extract the "2 subscribers" part as a string
    let subCountStringRaw = match[0].substring(23, match[0].length-1);

    let subCount = subCountStringRaw.split(' ')[0];
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
        // YTD-COMMENT-THREAD-RENDERER appears to be the correct tagName as of 2024-03-28.
        // I will temporarily leave YTD-COMMENT-RENDERER in case this change hasn't rolled out to all.
        if (el.tagName !== 'YTD-COMMENT-RENDERER'
         && el.tagName !== 'YTD-COMMENT-THREAD-RENDERER') return;
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

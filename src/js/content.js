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
  return subString;
}


const targetNode = document.querySelector('ytd-item-section-renderer#sections > div#contents');
const config = { childList: true };

const observer = new MutationObserver((mutationsList) => {    
  mutationsList.forEach(mutation => {
    mutation.addedNodes.forEach(async el => {
      if (el.tagName !== 'YTD-COMMENT-THREAD-RENDERER') return;
      const channelUrl = el.querySelector('div#author-thumbnail > a').href;
      const subs = await getSubs(channelUrl);

      const subCounterSpan = document.createElement('span');
      el.querySelector('div#header-author').appendChild(subCounterSpan);
      subCounterSpan.innerHTML = `${subs} sub${subs !== 1 && 's'}`;
      subCounterSpan.style.fontSize = '1.1em';
      subCounterSpan.style.color = '#ddd';
      subCounterSpan.style.backgroundColor = '#333';
      subCounterSpan.style.marginLeft = '4px';
      subCounterSpan.style.padding = '1px 3px 1px 3px';
      subCounterSpan.style.borderRadius = '3px';
    })
  })
});

observer.observe(targetNode, config);

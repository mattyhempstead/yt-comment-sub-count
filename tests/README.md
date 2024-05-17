# Tests

Lol pranked you thought I had tests.

Here is just a list of things to check when releasing.


1. Regular comments work (duh).
2. Comments work that are lazy loaded when you scroll to bottom of page.
3. Replies work.
4. All comments are updated when you navigate to a new video by clicking one in recommendations list.
4. Accounts with 0 subs, 1 sub, >1 subs.
5. The following channels if they leave a comment:
    - https://www.youtube.com/@chapterme
        - Should be a normal channel.
    - https://www.youtube.com/@MysticLogics
        - The JSON has multiple "subscriberCountText" strings so make sure we get the right one.

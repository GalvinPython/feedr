# Feedr
The next best Discord Bot to notify your members about YouTube video uploads!  
Feedr checks for new uploads every **15** seconds

Invite the bot [here](https://discord.com/oauth2/authorize?client_id=1243939861996503171&permissions=274877959232&integration_type=0&scope=applications.commands+bot)

# User Instructions
To track a channel, use the **/track** command, which will take in the following parameters
* `youtube_channel`, which is the YouTube Channel ID. It should begin with "UC" and have 24 characters (such as this: UCGJXFC0YsDzVP3ar8RzhCmA)
* `updates_channel`, which is the Discord channel that new uploads will be posted to
* `role` (OPTIONAL), which is the role to ping when there's a new upload.

To stop tracking a channel use **/untrack**

# Roadmap
Feedr strives for constant improvement, so here's what will be implemented
* YouTube Channel selector when using **/track**
* Make it easier to stop tracking channels by showing channels already in the guild when doing **/untrack**
* Other social media platforms
* Make it easier to switch discord channels for uploads so that **/untrack** then **/track** is not required
* **/tracked** command to show what channels are being tracked in the guild

# Permissions Needed
* View Channels
* Send Messages
* Send Messages in Threads
* Embed Links
* Attach Files
* Add Reactions

# Changelog
## 1.1.0
* Replies are no longer deferred
* Messages can now be sent in Announcement channels [1.0.3]
* Better checking for valid YouTube channel IDs
* Channels with no uploads will be tracked now

## 1.0.0
* Initial release
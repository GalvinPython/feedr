# Feedr

The next best Discord Bot to notify your members about YouTube video uploads!  
Feedr checks for:

- YouTube uploads every **3** seconds
- Twitch streams are live every **2** seconds

Invite the bot [here](https://discord.com/oauth2/authorize?client_id=1243939861996503171&permissions=274877959232&integration_type=0&scope=applications.commands+bot)

# User Instructions

To track a channel, use the **/track** command, which will take in the following parameters

- `youtube_channel`, which is the YouTube Channel ID. It should begin with "UC" and have 24 characters (such as this: UCGJXFC0YsDzVP3ar8RzhCmA)
- `updates_channel`, which is the Discord channel that new uploads will be posted to
- `role` (OPTIONAL), which is the role to ping when there's a new upload.

To stop tracking a channel use **/untrack**

# Roadmap

Feedr strives for constant improvement, so here's what will be implemented

- YouTube Channel selector when using **/track**
- Make it easier to stop tracking channels by showing channels already in the guild when doing **/untrack**
- Other social media platforms
  - Bluesky
- Make it easier to switch discord channels for uploads so that **/untrack** then **/track** is not required
- **/tracked** command to show what channels are being tracked in the guild

# Permissions Needed

- View Channels
- Send Messages
- Send Messages in Threads
- Embed Links
- Attach Files
- Add Reactions

# Developer Instructions

Feedr requires Bun in order to work

1. To install, run `bun i`
2. Fill out all the required values in `.env.example` and rename it to `.env` once done
3. To run in developer mode, just run `bun --watch . --dev`, otherwise `bun run .`

## Design Rules

These rules are what to follow when working and developing on Feedr. There aren't a lot, but important for error handling.

### Database Function Return Guidelines

Each database function (located in `/src/utils/db`) should **always** return a success indicator (`true`/`false`) along with associated data. To avoid confusion, here are the expected return types:

- **Success with data:** `true` should always return populated data, even if the data is not used. For example:

  ```ts
  return { success: true, data: Data as Data };
  ```

- **Success without data:** `true` can also indicate a successful operation where no data is returned. In this case, an empty array (`[]`) should be provided:

  ```ts
  return { success: true, data: [] };
  ```

- **Failure:** `false` should indicate an error or unsuccessful operation. This should always return an empty array (`[]`) to ensure consistency:
  ```ts
  return { success: false, data: [] };
  ```

These guidelines ensure predictable behavior and simplify error handling across the application.

# Changelog

## 1.4.0

- Added a new command! `/tracked` ([#50](https://github.com/GalvinPython/feedr/issues/50))
  - See all the tracked channels in your server
  - The channel you ran the command in will appear first as there is no option to only see the current channel for now
- Locale improvments ([#43](https://github.com/GalvinPython/feedr/issues/43))

## 1.3.0

- Moved database to SQLite

## 1.2.0

- Added Twitch feed
- `platform` added to both **/track** and **/untrack**

## 1.1.0

- Replies are no longer deferred
- Messages can now be sent in Announcement channels [1.0.3]
- Better checking for valid YouTube channel IDs
- Channels with no uploads will be tracked now

## 1.0.0

- Initial release

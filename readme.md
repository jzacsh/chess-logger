# Chess Notes

Web app for recording chess games - offline, if necessary - in [pgn
format](http://en.wikipedia.org/wiki/Portable_Game_Notation). Allows easy
playback of games, and eventually will sync to third-party cloud storage _(eg:
Google Drive, Dropbox, etc)_ for persistent history and analysis.

## There's an app for that
I **was** using [yNote](https://play.google.com/store/apps/details?id=com.chess.yNotate2.ui.android)
native android app, but was frustrated with a few missing features.

## Disclaimer & License
See [LICENSE](LICENSE). Note: this is **not** a Google product. This is just a fun, personal
weekend project I whipped up when I got frustrated trying to review previously
logged chess games.

## Hacking
### Testing
```bash
grunt test
```

### Deploying to KeyCDN
To populate `./dist/` with static app contents, run:
```
grunt build
```

```bash
grunt deploy  # assumes ssh_conf(5) w/a "keycdn" Host
```
Optionally: [KeyCDN's simple curl command to purge
cache](https://www.keycdn.com/api#purge-zone-cache)

### One-Time Setup

```bash
$ npm install
$ node_modules/bower/bin/bower install
```

Note: All `grunt` references in this doc can be replaced with
`./node_modules/grunt-cli/bin/grunt`.

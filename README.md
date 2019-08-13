## LEO Twitter Burn Bot
Report LEO token burns to twitter 🦁

### Setup
Copy `.env.example` to `.env` and populate with your twitter access credentials. Set the `LAST_MANUAL_BURN` param to the timestamp of the last reported burn (or to the current time to report all future burns)

### Systemd
To run as a systemd service, copy & modify (see contents) the provided service file (`services/leo-twitter-burn-bot.service`) to `/etc/systemd/system/leo-twitter-burn-bot.service`, then run:

* `systemctl daemon-reload`
* `systemctl enable leo-twitter-burn-bot`
* `systemctl start leo-twitter-burn-bot`

### Running
`npm start`

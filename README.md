# X-Redirect

[Install](https://raw.githubusercontent.com/Amqx/x-redirect/refs/heads/master/x-redirect.user.js)

Small user script that matches Twitter/X domains and redirects to a Nitter instance.

This does not bundle an instance - you must provide one. The script doesn't do
anything until it has a Nitter url.

## Setup

1. Install the script in Tampermonkey / Violentmonkey.
2. Open `x.com` (or `twitter.com`). The script asks which instance to use - enter a
   host such as `nitter.example.com` and confirm.
3. That's it. The choice is stored and used for every later visit.

You can change it later from the userscript manager's menu on any matched page:

- **Set redirect instance…** — enter a new host (empty input disables redirecting).
- **Clear redirect instance** — forget the host; `x.com` / `twitter.com` no longer redirect.

Input is accepted with or without a scheme, and may include a port or a base path
(`nitter.example.com`, `https://nitter.example.com`, `example.com/nitter`). Redirects
always go out over HTTPS, carrying the original path, query and fragment.

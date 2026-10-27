# X-Redirect

[Install](https://raw.githubusercontent.com/Amqx/x-redirect/refs/heads/master/x-redirect.user.js)

Small user script that matches Twitter/X domains and redirects to a Nitter instance,
with an optional backup instance used when the primary is unreachable.

This does not bundle an instance - you must provide one. The script doesn't do
anything until it has a Nitter url.

## Setup

1. Install the script in Tampermonkey / Violentmonkey.
2. Open `x.com` (or `twitter.com`). The script asks for a primary instance, then an
   optional backup - enter hosts such as `nitter.example.com` and confirm.
3. That's it. The choice is stored and used for every later visit.

## Primary and backup

When both are set, every visit first checks if the primary is alive. Any response
at all (even an error status) counts as reachable and you go to the primary.
A network error, or no answer within 3 seconds, sends you to the backup instead. The
backup itself is not checked. With only one instance set there is no check.

Your userscript manager may ask once for permission to connect to the primary host.

## Change the instance

Open the [redirect settings page](https://x.com/?x_redirect_settings=1) to change or clear the instances. You can bookmark that link for later. You are asked for the primary, then the backup. Enter a host to save it, leave a field empty to unset that one, or cancel either prompt to keep the current settings. Leaving both empty disables redirecting. After saving, the page opens the chosen instance.

The userscript manager's menu also provides these commands on X/Twitter pages and on
your configured instances, so you can change settings after being redirected:

- **Set redirect instances…** — enter the primary and backup hosts (empty input unsets one).
- **Clear redirect instances** — forget both; `x.com` / `twitter.com` no longer redirect.

Input is accepted with or without a scheme, and may include a port or a base path
(`nitter.example.com`, `https://nitter.example.com`, `example.com/nitter`). Redirects
always go out over HTTPS, carrying the original path, query and fragment.

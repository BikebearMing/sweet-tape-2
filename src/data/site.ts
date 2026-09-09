/* The site's public origin, for anything that has to print an absolute URL —
   the sitemap, robots, Open Graph. SERVER_URL is the same variable the admin's
   preview pane reads (payload.config.ts), so one env var names the domain. */
export const SITE_URL = (process.env.SERVER_URL ?? "http://localhost:3000").replace(/\/$/, "");

---
title: breakcore.com.au — first archive version live
date: 2026-06-23
summary: Recovered phpBB export is browseable on the live site; beta rebuild lane still under slow construction.
tags:
  - breakcore
  - archive
  - cloudflare
  - homelab
---

The old breakcore.com.au board died with the Sakura host. I pulled what I could from recovery dumps and rebuilt it as a static archive instead of trying to resurrect phpBB on a box I do not control anymore.

## What shipped today

- **Live:** [breakcore.com.au](https://breakcore.com.au/) — read-only archive of forums, threads, flyers, and embeds from the phpBB export. Member avatars where the recovery still had files; coloured initials for everyone else. Search works across the recovered posts.
- **Beta:** [beta.breakcore.com.au](https://beta.breakcore.com.au/) — same archive skin for now, but this lane is where the actual forum rebuild will land. Logins, replies, and new posts are not ready. I am building it slowly between everything else.

The live site is intentionally honest about what it is: **ARCHIVE / PRE-REBUILD** banners on posts, no pretend write access. If you have a flyer or thread that never made it into the dump, ping me on Discord or [aday@aday.net.au](mailto:aday@aday.net.au).

## Under the hood (short)

- Import pipeline from Sakura TSV + attachment recovery into SQLite, then static JSON for Cloudflare Pages.
- Link and embed repair pass on malformed phpBB HTML (escaped URLs, broken CODE blocks, bandcamp/youtube/soundcloud embeds).
- Artist carousel and an A/B deck player on the homepage — soundcloud, bandcamp embeds, youtube, mixcloud links scraped from the archive.

Repos: [breakcore-com-au](https://github.com/aday1/breakcore-com-au) (live), [breakcore-forums-placeholder](https://github.com/aday1/breakcore-forums-placeholder) (beta lane).

## What is not done

Beta is under construction. Login gating, new threads, and a proper post editor are still on the list. Do not expect the beta URL to move fast — it will inch forward when I have a free evening, same as every other long-haul project on this domain graph.

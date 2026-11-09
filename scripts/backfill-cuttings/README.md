# Cuttings backfill

One-off scripts that made the cuttings in `content/cuttings/2025` and `content/cuttings/2026` from Buffer's sent history, on 2026-10-27. The originals were lost; these were rebuilt from the Claude Code session transcript on 2026-11-09.

1. Export from buffer-trickle's D1 into this directory:

   ```
   D=$PWD
   cd ~/git/buffer-trickle
   npx wrangler d1 execute buffer-trickle --remote --json --command "SELECT id, service, sent_at, text, external_link FROM buffer_history" > $D/hist.json 2>/dev/null
   npx wrangler d1 execute buffer-trickle --remote --json --command "SELECT id,status,url,title,domain,text,card_text,card_extra FROM posts WHERE status IN ('published','queued') ORDER BY id" > $D/trickle.json 2>/dev/null
   ```

2. `python3 -I collect.py` writes `shares.json`. It fetches every linked page, so it takes a few minutes.
3. `python3 -I generate.py <rmoff-blog checkout>` writes the cuttings, `review.tsv` and `written.txt`.

`generate.py` overwrites a cutting with the same file name, so hand edits to it are lost. Before writing, it deletes the files listed in `written.txt` from the last run.

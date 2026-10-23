# Project notes for Claude

## Keep the build journal up to date

`docs/08-build-journal.md` records every change to this project and the
thinking behind it. After each change is committed:

1. Add a new numbered section at the end of the chapters (before
   "Patterns in how I worked"), dated, in first person from the owner's
   point of view: what they asked for or decided, why, and what changed.
   Base it on what they actually said; don't invent reasons.
2. Add a row to the "At a glance" table.
3. Link the commit(s) by short hash, adding the reference-style link
   definitions at the bottom of the file.
4. Update "What's next" if an open item was finished or a new one came up.

A commit can't contain its own hash, so commit the change first, then
commit the journal entry right after it and push both together.

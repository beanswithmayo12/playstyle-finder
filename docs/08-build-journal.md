# 08 — Build Journal

How Playstyle Finder got from an idea to what it is now: what I decided at
each step, why, and the commit that made it happen. I built it with Claude
Code as a pair programmer. The calls about what to build, what to cut and
how it should feel were mine, and this log is a record of them.

**July 28 – October 23, 2026 · 30 commits on `claude/soccer-playstyle-matching-saas-mplk26`**

## At a glance

| Date | Milestone | Commits |
|---|---|---|
| Jul 28 | The idea and the blueprint | [6473e7f] |
| Jul 28–29 | Phases 0–4: app, sign-in, payments, matching, quiz, programs, film analysis | [7265336] [610f30d] [e7b1a66] [ae0cfa9] [3845a41] [b488c1d] [7cb5e76] |
| Aug 16 | The 2K-style player builder | [4144284] |
| Sep 4 | Making it testable without paying for anything | [eb40095] [2c2ba47] [529deac] [3baa7cd] [9eb5155] [0489e4e] [1b655b0] [ccc3c22] |
| Sep 26 | Film first, quiz second | [3219b2b] |
| Sep 26 | More value from the same data: film breakdown, recruiting, team vs solo training | [88bf9d8] [42f313a] [7c43655] |
| Sep 26–27 | Should I train my own AI? And the business model | — |
| Oct 21 | The redesign: "Same game. Different stage." | [99df1fd] [2137162] |
| Oct 21 | "Where you play" heat map | [a9ab1bd] |
| Oct 21 | Motion and interaction, previewed before building | [fdb1b7c] |
| Oct 23 | Hover pop and dashboard tabs | [4923d59] [563ad2f] |
| Oct 23 | A roadmap for going live with real data | [d347122] |

---

## 1. The idea · Jul 28

Soccer players watch pros all the time, but nobody tells them *which* pro
actually plays like them, or what to train to get closer. I wanted an app
that analyzes how an athlete plays, matches them to a professional, shows
them how to study that player, and sells a training program built around
closing the gap.

The first thing I asked for was a full blueprint before any code: the stack,
the database, the matching math, the AI prompts, and how the business makes
money. I wanted to see the whole shape before committing to any one piece.
That became `docs/01`–`06`. ([6473e7f])

## 2. Building the core · Jul 28–29

I followed the roadmap one phase at a time and checked each one before saying
"yes" to the next:

- **Phase 0**: the Next.js app, database, and sign-in with Clerk. ([7265336], [610f30d])
- **Payments**: Stripe for one-time program purchases and memberships. ([e7b1a66])
- **Phase 1**: the pro roster (36 pros) and the matching engine, with tests. ([ae0cfa9])
- **Phase 2**: the quiz, the match reveal, the dashboard, and a shareable match card. ([3845a41])
- **Phase 3**: 8-week training programs and the page that sells them. ([b488c1d])
- **Phase 4**: highlight-reel analysis, so a player's film can score them, not just their answers. ([7cb5e76])

Most of my time here went into actually getting it running on my laptop:
seeing the site locally, sorting out git pulls, and fixing setup errors.

## 3. The 2K-style player builder · Aug 16

Once the quiz worked, I wanted it to feel like a game. Like NBA 2K, after the
quiz a player can spend attribute points to build their "99 overall" self,
compare that dream build to who they are today, and see which pros play like
the build. The budget forces real tradeoffs, so you can't max everything.
([4144284])

## 4. Making it testable without paying for anything · Sep 4

I hit a wall: the AI calls needed a paid API key, video storage wanted a
card, and the film analysis kept getting stuck. I wasn't ready to pay just
to see if the site worked the way I wanted, so the goal became "the whole
product runs for free on my laptop":

- **Demo AI mode**: with `MOCK_AI=1`, the full product runs with zero AI calls and clearly labeled sample output. ([529deac])
- **Local video storage**: reels save to my machine in development, so I don't need a cloud bucket yet. I can switch to real storage later without changing anything else. ([3baa7cd])
- **Fixes I found by actually testing**: a broken Retry button, hidden error messages, upload size limits, the video tool not being found, failed attempts using up the monthly limit, and a stuck "analyzing" screen. ([eb40095], [2c2ba47], [9eb5155], [0489e4e], [1b655b0], [ccc3c22])

## 5. Film first, quiz second · Sep 26

This was the biggest product decision. I started questioning the quiz: if
players describe themselves, it defeats the point of the app figuring out
what kind of player they are. But some players don't have highlights, or only
have short clips.

My answer: make **film the main path** and keep the quiz as a fallback. I
found a layout I liked and asked for something similar: a drag-and-drop area
(or file picker, or YouTube link) as the main thing on the homepage, with the
quiz as a button underneath. ([3219b2b])

## 6. More value from the same data · Sep 26

Once a player's film is analyzed, I asked what else they could use that data
for, and added:

- **Film breakdown**: stats from their reel (take-ons, shots, key passes) with timestamps that jump to each moment.
- **Recruiting profile**: a shareable page for college and club coaches, private until they publish it.
- **Solo vs team-practice training**: players train two ways, so I split it. One track is a program they do on their own. The other is habits and focuses to bring into the team practices they already go to, which builds good habits without adding extra training load.

([88bf9d8], [42f313a], [7c43655])

## 7. Should I train my own AI? · Sep 26

I thought about training a custom model that watches highlight videos and
compares players against a database. After talking it through, I decided
**not yet**: it needs a lot of labeled footage and money I don't have at
this stage. The current approach (a general AI model plus my matching
engine) gets the product in front of players first. Real user film collected
over time is what would make a custom model possible later.

## 8. The business model · Sep 27

I mapped out how this makes money and condensed it onto a single slide: the
scouting report is free (that's the hook and what gets shared), and the
money comes from the paid 8-week programs and a membership.

## 9. "Functional but ugly": the redesign · Oct 21

The app worked, but it didn't look good. Before changing anything, I asked
for several design directions plus questions to pin down what I was going for.

- I was shown three looks: a gamer "Ultimate Team" style, a green "Matchday" broadcast style, and a clean "Academy Report" style.
- **My call:** keep Matchday's *features* (the head-to-head comparison and the key moments panel) but with the Academy Report's clean *look*. **No green.**
- From a bolder variant, I kept the **dark key-moments panel**.
- **Dark mode**, switchable both ways, starting in **light mode**, and covering every page.
- **Tagline:** I didn't think "Get scouted like a pro" or "Who do you play like?" were strong enough. "Every player has a pro twin" was close but not catchy. I picked **"Same game. Different stage."**
- **Phones:** I decided not to design for phones yet and to focus on the desktop experience first.

([99df1fd])

While reviewing it, two things bothered me. The homepage headline wrapped one
word per line, and the ratings felt off: a pro like Doku showing 71 overall
doesn't make sense. Ratings now count the attributes that matter for each
position, so pros land in the 80s–90s and a maxed build can reach 99.
([2137162])

## 10. "Where you play" heat map · Oct 21

One of the design mockups had a pitch with a heat map, and I wanted it on the
real dashboard along with the player's common tendencies. The real version
would need the AI to tag where on the pitch each action happens. I decided to
**ship it as a clearly labeled demo for now**: it's estimated from position,
foot and ratings, and I'll build the film-based version later. ([a9ab1bd])

## 11. Motion and interaction · Oct 21

Next I wanted more energy in the interface. This time I asked to **see the
ideas before anything was built or committed**, so I got a clickable preview
page with 8 numbered options for the dashboard. I asked for the sign-in
screens too (6 more), then for everything on one page so I could compare.

My first instinct was to cut what I didn't like, but after seeing it all
together I **kept all 14**:

1. Ratings count up and the match % stamps in
2. Head-to-head bars race out, and hovering shows the gap
3. Heat map toggle: You / your pro / Both, with an overlap score
4. Hover a zone of the pitch to see time spent there
5. Hover a tendency and the move draws itself on the pitch
6. Film timeline with a tick for every tagged moment
7. Cards lift and buttons press down
8. The light/dark switch spreads out in a circle
9. A locked, blurred report next to the sign-up form
10. The pro's name shuffles through the roster, then lands on your match
11. Sign-up forms restyled to match the site
12. Progress steps: Quiz → Account → Your report
13. Pitch lines draw themselves behind the sign-up screen
14. A "Welcome back" sign-in popup

Every effect has its own on/off switch in `src/lib/flair.ts`, so I can drop
any of them later with a one-line change. ([fdb1b7c])

## 12. Hover pop · Oct 23

Anything I hover over should feel like it comes a little closer. **Subtle,
not a lot.** Buttons grow 3%, wide items and cards about 1.5%, and buttons
press in slightly when clicked. It's switch 15. ([4923d59])

## 13. Dashboard tabs · Oct 23

With everything added, the dashboard was too much to scroll through. I asked
for tabs. The scoreboard stays on top, and the sections live in a tab bar
that stays pinned while scrolling: Overview, Scout report, Where you play,
Training and Build & profile. The Training tab shows the player's biggest gap
right on it. ([563ad2f])

## 14. A roadmap for going live with real data · Oct 23

With the product looking and feeling the way I want, the next question was
how to make it actually *work*: real AI, real data, no fake info. I asked for
a roadmap to get there. It starts with an honest list of everything that's
demo or placeholder today (AI output, film events, the heat map, pro ratings,
payments, storage), then lays out phases: turn on the real AI, prove the film
analysis is accurate with a hand-labeled test set of real reels, replace the
hand-typed pro ratings with real stats, launch, and test with beta players.
It also lists the decisions that are mine to make, like which AI model to
use, the pro data source, and the age policy. ([d347122],
`docs/09-going-live-roadmap.md`)

---

## Patterns in how I worked

- **See it before building it.** For anything visual (the redesign, the motion pass) I asked for options and a preview first, then decided.
- **Test it free before paying for it.** Demo AI mode and local storage let me prove the product before spending on API keys or cloud storage.
- **Film over self-report.** The point is to show players how they *actually* play, which is why film became the main path and the quiz the backup.
- **Be honest about what's real.** The demo AI output, the estimated heat map and the sample sign-up preview are all labeled as such.
- **Keep it reversible.** Effects sit behind switches, and big changes happen in one commit each, so any decision can be undone cleanly.

## What's next

The full plan is in [09-going-live-roadmap.md](09-going-live-roadmap.md). In short:

- Turn on the real AI and check 20 quiz reports by hand
- Build a labeled test set of real reels and measure film accuracy
- Heat maps built from real film
- Pro ratings from real match stats, and a coach review of the programs
- A phone layout, legal basics, and launch
- A custom model trained on real user film, once there's enough of it
- A `main` branch with pull requests, for when there's a team or a deploy

[6473e7f]: https://github.com/beanswithmayo12/playstyle-finder/commit/6473e7f
[7265336]: https://github.com/beanswithmayo12/playstyle-finder/commit/7265336
[610f30d]: https://github.com/beanswithmayo12/playstyle-finder/commit/610f30d
[e7b1a66]: https://github.com/beanswithmayo12/playstyle-finder/commit/e7b1a66
[ae0cfa9]: https://github.com/beanswithmayo12/playstyle-finder/commit/ae0cfa9
[3845a41]: https://github.com/beanswithmayo12/playstyle-finder/commit/3845a41
[b488c1d]: https://github.com/beanswithmayo12/playstyle-finder/commit/b488c1d
[7cb5e76]: https://github.com/beanswithmayo12/playstyle-finder/commit/7cb5e76
[4144284]: https://github.com/beanswithmayo12/playstyle-finder/commit/4144284
[eb40095]: https://github.com/beanswithmayo12/playstyle-finder/commit/eb40095
[2c2ba47]: https://github.com/beanswithmayo12/playstyle-finder/commit/2c2ba47
[529deac]: https://github.com/beanswithmayo12/playstyle-finder/commit/529deac
[3baa7cd]: https://github.com/beanswithmayo12/playstyle-finder/commit/3baa7cd
[9eb5155]: https://github.com/beanswithmayo12/playstyle-finder/commit/9eb5155
[0489e4e]: https://github.com/beanswithmayo12/playstyle-finder/commit/0489e4e
[1b655b0]: https://github.com/beanswithmayo12/playstyle-finder/commit/1b655b0
[ccc3c22]: https://github.com/beanswithmayo12/playstyle-finder/commit/ccc3c22
[3219b2b]: https://github.com/beanswithmayo12/playstyle-finder/commit/3219b2b
[88bf9d8]: https://github.com/beanswithmayo12/playstyle-finder/commit/88bf9d8
[42f313a]: https://github.com/beanswithmayo12/playstyle-finder/commit/42f313a
[7c43655]: https://github.com/beanswithmayo12/playstyle-finder/commit/7c43655
[99df1fd]: https://github.com/beanswithmayo12/playstyle-finder/commit/99df1fd
[2137162]: https://github.com/beanswithmayo12/playstyle-finder/commit/2137162
[a9ab1bd]: https://github.com/beanswithmayo12/playstyle-finder/commit/a9ab1bd
[fdb1b7c]: https://github.com/beanswithmayo12/playstyle-finder/commit/fdb1b7c
[4923d59]: https://github.com/beanswithmayo12/playstyle-finder/commit/4923d59
[563ad2f]: https://github.com/beanswithmayo12/playstyle-finder/commit/563ad2f
[d347122]: https://github.com/beanswithmayo12/playstyle-finder/commit/d347122

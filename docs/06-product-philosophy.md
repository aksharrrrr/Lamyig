# product-philosophy

Lamyig is built around information, not transactions. It is not trying to become another booking platform or another navigation app - those already exist and already fight over the same well-served slice of the problem (see [`02-problem.md`](02-problem.md)).

Every feature is tested against one question: **does this help a traveller discover reliable information?** If not, it does not belong in the MVP.

## Principles

**Community first.** The platform is built by travellers and local communities, for future travellers. Community participation is the primary source of knowledge, not a founder-maintained catalogue.

**Information over features.** The platform exists to provide reliable information. It should not accumulate features that don't serve that purpose.

**Facts over ratings.** No star ratings, no popularity scores. Structured factual information instead - price range, meals included, mobile network by operator, clean toilets, drinking water, bike parking, community notes, last verified. See D-004 in [`14-decision-log.md`](14-decision-log.md).

**Keep it simple.** Adding or updating information should take a few minutes, not a form marathon.

**Offline matters.** Remote travel means poor or no connectivity. Essential information must be accessible offline. See D-005 in [`14-decision-log.md`](14-decision-log.md).

**Open source.** The project is open so the travel community can keep improving both the platform and the data.

## What Lamyig is not

- Not a booking platform.
- Not a navigation app.
- Not a social media platform.
- Not a review platform.
- Not a trip planner.

Lamyig focuses exclusively on community knowledge - everything above already exists and is well served elsewhere.

## Deliberately excluded

- **Star ratings** - replaced by Community Notes (free-text factual observations) and structured facts. Never planned for V1.
- **Comments / discussion threads** - excluded to keep information structured and reduce moderation load.
- **Gamification** - no points, coins, badges, leaderboards, or streaks. The goal is contribution, not engagement metrics.

See D-011 in [`14-decision-log.md`](14-decision-log.md).

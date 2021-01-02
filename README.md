# foundry-burningwheel
Unofficial community Foundry VTT system for The Burning Wheel RPG.

Provides character sheet support, dice rolling, and a number of automation features for The Burning Wheel.
Based on the Burning Wheel Gold Revised rules available in [the burning wheel store.](https://www.burningwheel.com/burning-wheel-gold-revised/)

If you like this system, please support the developers at [burningwheel.com](https://www.burningwheel.com/)

For usage help check [the wiki.](https://github.com/StasTserk/foundry-burningwheel/wiki)

## State of Development

The system is in a state that I would consider "done." While there are some outstanding nice-to-have things still left to implement, there is nothing incredibly pressing to add and the vast majority of the features that were envisioned when the project was undertaken are now present. At this point, the system is going to enter into maintenance mode.

I plan to ensure compatibility with future releases of Foundry, and respond to bug reports. New Feature requests are possible but pull requests for cool new things are preferred.

## Current features
- Actor sheet support for Player Characters
- Actor Sheet support for NPCs
- Item sheet support for:
  - Weapons, armor and other possessions.
  - Skills
  - Relationships, reputations and affiliations
  - Spells
- Automation for tracking test advancement, artha, and calculating a number of derived attributes
- Character burner:
  - Ability to include world and compendium content when configuring the character burner
  - Support for dragging and dropping most items directly into the compendium
  - Ability to define lifepaths and group them into settings for further drag and drop functionality
- Support for GM created compendiums in play and character burning.
- Specialized dialogs for extended tests:
  - Specialized dialog for Duel of Wits, Fight!, and Range and Cover.
  - Extended test mode where advancement is deferred until later.
- Alternate roll modes -- Hold Alt, Ctrl/Cmd, or Shift when pressing one of the roll buttons to use an alternate rolling mode.
- Global GM set difficulty (possible to disable in system settings)

## Future Plans
- Localization support of different languages.
- A possible utilization of Active Effects once the Active Effect code fixes a number of known issues.

## Installation
To install and use The Burning Wheel for foundry, paste the following URL into the Install System dialog in the setup menu of the application.

https://raw.githubusercontent.com/StasTserk/foundry-burningwheel/master/system.json

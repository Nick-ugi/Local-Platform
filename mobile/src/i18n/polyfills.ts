// Hermes, the engine the app runs on, has no Intl.PluralRules, which use-intl needs for messages
// such as "{count, plural, one {# result} other {# results}}". This adds it where it is missing,
// with the English rules, before any message is formatted. Where the engine has it (Node, under
// Jest) nothing changes.
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";

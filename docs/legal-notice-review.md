# Neighborly Exchange — Legal Notice Pre-Deploy Review

_Reviewed 2026-11-21. Online copy: https://claude.ai/artifact/BNDqdhFks1APMWQvh6TCd7_

This is a review of the `src/pages/Legal.jsx` Legal Notice page. It is not legal advice; have a lawyer review the final text.

> **Status (2026-11-21):** fixes 2–8 and the code nits below have been applied to `src/pages/Legal.jsx`. All operator details are still `[PLACEHOLDER — …]` constants at the top of that file and must be filled in before deploying.

## Must fix before deploying

1. **The placeholders are still in the page.** Fill in the constants at the top of `Legal.jsx` (and the contact email in `Terms.jsx`). Add a build or CI check that fails on the string `PLACEHOLDER`.
2. **The effective date was wrong ("July 2026").** Now a placeholder; set it to the real launch date, written out in full.
3. **The "no postal address" line will probably be a problem.**
   - **California:** Civil Code § 1789.3 requires an online service provider to give consumers its name, address and telephone number, plus complaint-resolution procedures, including contact details for the Department of Consumer Affairs' Complaint Assistance Unit. It was written for paid "commercial" services, so whether it covers a free platform is debatable, but many sites include the notice anyway. (Added.)
   - **Germany/Austria users:** an Impressum is required under § 5 DDG. It requires the provider's name and an address where legal documents can be served; P.O. boxes are not sufficient.
   - **Fix:** use a registered agent or virtual business address if you don't want your home address public. (The "no address" sentence was removed.)

## Legal gaps to close

4. **DMCA:** register a designated agent with the U.S. Copyright Office, keep the agent's contact information current there and on the site, and adopt a repeat-infringer policy. (A DMCA card was added; fill in the agent's details.)
5. **Governing law and content license belong in the Terms of Service.** `Terms.jsx` currently has neither; consider adding both there. (The Legal page now links to Terms and Privacy, and the governing-law line refers to the Terms of Service.)
6. **Content license was too narrow.** (Broadened to host, store, reproduce, adapt and display, ending when content is deleted.)
7. **Barter can be taxable income.** The IRS defines a barter exchange as an organization whose members contract with each other, or with the exchange, to trade property or services; barter exchanges must issue Form 1099-B. A plain skills directory probably isn't one, but ask a tax professional if you add platform-tracked points or credits. (A "Taxes" card was added.)
8. **Meeting in person safely.** (A "Meeting Safely" card was added, consistent with Terms §7.)

## Accuracy checks

- [x] **Verified badge:** the code requires email + photo + bio + neighborhood, then moderator approval (`Verification.jsx`), matching Terms §5. Legal now says "approved by a moderator" too. If `VITE_PHONE_VERIFICATION` is switched on, update all three descriptions.
- [ ] **"Does not process monetary transactions":** confirm no premium tier, tips or donations are planned.
- [ ] **"In-app report system":** confirm the report feature is live at launch.

## Code changes made

- Repeated card markup replaced with a `<Section icon title>` component.
- Every card has an icon (`Copyright` for IP/DMCA, `Handshake` for disputes, `Info` for the notice).
- Placeholders consolidated into named constants at the top of the file.

## Open questions

- Is the launch US-only, or international (especially Germany/Austria)?
- Is the operator an individual or an LLC?

## Sources

- [Cal. Civ. Code § 1789.3 (FindLaw)](https://codes.findlaw.com/ca/civil-code/civ-sect-1789-3/)
- [CA Department of Consumer Affairs — Contact Us](https://dca.ca.gov/about_us/contactus.html)
- [mobile.de — Imprint requirements under § 5 DDG](https://www.mobile.de/en/service/dealerHomepageImprint/)
- [U.S. Copyright Office — DMCA Designated Agent Directory](https://copyright.gov/dmca-directory/)
- [U.S. Copyright Office — Section 512 resources](https://copyright.gov/512/)
- [IRS Topic No. 420, Bartering Income](https://www.irs.gov/taxtopics/tc420)
- [IRS — Barter Exchanges](https://www.irs.gov/businesses/small-businesses-self-employed/barter-exchanges)

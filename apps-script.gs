/**
 * Deploy as Web app: Execute as Me, Who has access: Anyone.
 * Set SPREADSHEET_ID. Create tabs named "Survey" and "Email signups" (or edit constants).
 *
 * Survey tab — row 1 headers (must match column order in appendRow):
 * receivedAt | drinksOrdered | drinksOrderedOther | teasLoved | teasLovedOther |
 * breakfastItems | breakfastItemsOther | lunchItems | lunchItemsOther |
 * cakeFlavors | cakeFlavorsOther | favoriteShops | dietaryRestrictions |
 * fastInternetPremium | kidsAreaBother | visitFrequency | visitContext |
 * cafeElse | contactInfo | submittedAt
 *
 * Email signups tab — row 1 headers:
 * receivedAt | email | submittedAt
 */
const SPREADSHEET_ID = "YOUR_SHEET_ID";
const SHEET_SURVEY = "Survey";
const SHEET_EMAIL = "Email signups";

function joinList(value) {
  return (value || []).join("; ");
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (payload.submissionType === "email") {
      const sheet = ss.getSheetByName(SHEET_EMAIL);
      if (!sheet) {
        throw new Error('Missing sheet tab: "' + SHEET_EMAIL + '"');
      }
      sheet.appendRow([
        new Date(),
        payload.email || "",
        payload.submittedAt || "",
      ]);
    } else {
      const sheet = ss.getSheetByName(SHEET_SURVEY);
      if (!sheet) {
        throw new Error('Missing sheet tab: "' + SHEET_SURVEY + '"');
      }
      var p = payload;
      sheet.appendRow([
        new Date(),
        joinList(p.drinksOrdered),
        p.drinksOrderedOther || "",
        joinList(p.teasLoved),
        p.teasLovedOther || "",
        joinList(p.breakfastItems),
        p.breakfastItemsOther || "",
        joinList(p.lunchItems),
        p.lunchItemsOther || "",
        joinList(p.cakeFlavors),
        p.cakeFlavorsOther || "",
        p.favoriteShops || "",
        p.dietaryRestrictions || "",
        p.fastInternetPremium || "",
        p.kidsAreaBother || "",
        p.visitFrequency || "",
        joinList(p.visitContext),
        p.cafeElse || "",
        p.contactInfo || "",
        p.submittedAt || "",
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

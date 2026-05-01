/**
 * Deploy as Web app: Execute as Me, Who has access: Anyone.
 * Set SPREADSHEET_ID. Create tabs named "Survey" and "Email signups" (or edit constants).
 *
 * Survey tab — suggested row 1 headers:
 * receivedAt | drinkerType | drinksOrdered | teasLoved | breakfastItems | lunchItems |
 * cakeFlavors | favoriteShops | dietaryRestrictions | cafeElse | contactInfo | submittedAt
 *
 * Email signups tab — suggested row 1 headers:
 * receivedAt | email | submittedAt
 */
const SPREADSHEET_ID = "YOUR_SHEET_ID";
const SHEET_SURVEY = "Survey";
const SHEET_EMAIL = "Email signups";

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
        p.drinkerType || "",
        (p.drinksOrdered || []).join("; "),
        (p.teasLoved || []).join("; "),
        (p.breakfastItems || []).join("; "),
        (p.lunchItems || []).join("; "),
        (p.cakeFlavors || []).join("; "),
        p.favoriteShops || "",
        p.dietaryRestrictions || "",
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

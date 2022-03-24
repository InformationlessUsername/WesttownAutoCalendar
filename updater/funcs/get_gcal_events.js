import { addWeeks } from "date-fns";
import fs from "fs";
import snooze from "./snooze.js";
import log_info from "./log_info.js";

let client_email = JSON.parse(fs.readFileSync("./updater/service_account_key.json"))["client_email"];

/**
 * @param {string} email the email of the user
 * @param {Object} calendar_client Google calendar client
 * @returns {Array} Array of all Google Calendar events **made by this script**
 */
async function get_gcal_events(email, calendar_client, pageToken = null) {
  try {
    let response_info = await calendar_client.events.list({
      pageToken: pageToken,
      // The user's primary calendar's ID = their email address
      calendarId: email,
      timeMin: new Date().toISOString(),
      // Goes more than 8 (mySchoolApp default) weeks just in case
      timeMax: addWeeks(new Date(), 12).toISOString(),
      // Ignore deleted events
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    let events = response_info.data.items;

    pageToken = response_info.data.nextPageToken;

    if (response_info.data.nextPageToken) {
      snooze(500);
      let next_page = await get_gcal_events(email, calendar_client, pageToken);
      return events.concat(next_page);
    } else {
      // Called when highest level of recursion finishes (when no more pages)
      return events.filter((event) => event.creator.email == client_email);
    }
  } catch (error) {
    log_info("Error getting Google Calendar Events,,,", 2, error);
    return false;
  }
}

export default get_gcal_events;

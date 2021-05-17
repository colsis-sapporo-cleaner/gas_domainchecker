const SLACK_URI:string = 'https://slack.com/api/';

export class Slack {
  private token:string;
  private channel:string;

  constructor (params) {
    this.token = params.accessToken;
    this.channel = params.channelId;
    if (!this.token || !this.channel) {
      throw new Error('Required property was not specified.');
    }
  }

  postDomainExpireRemindMessage (user:string, message:string, icon:string) {
    const endpoint:string = 'chat.postMessage';
    const opt:GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      payload: {
        token: this.token,
        channel: this.channel,
        text: message,
//        as_user: false,
        username: user,
        icon_emoji: icon,
      }
    };
    UrlFetchApp.fetch(`${SLACK_URI}${endpoint}`, opt);
  }

}

export class Properties {
  sheetId:string;
  domainsSheet:string;
  slackAccessToken:string;
  slackChannelId:string;

  constructor () {
    this.sheetId = this._getProperty('SHEET_ID');
    this.domainsSheet = this._getProperty('DOMAINS_SHEET_NAME');
    this.slackAccessToken = this._getProperty('SLACK_ACCESS_TOKEN');
    this.slackChannelId = this._getProperty('SLACK_CHANNEL_ID');
  }

  private _getProperty (name:string): string {
    if (!name) throw 'Property name not specified.';
    return PropertiesService.getScriptProperties().getProperty(name);
  }
}

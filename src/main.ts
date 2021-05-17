import { Properties } from "./Properties";
import { DomainsSheet } from "./DomainsSheet";
import { Whois } from "./Whois";
import { Slack } from "./Slack";

const SLACKBOT_ICON:string = ':alarm_clock:';

export function main () {
  const prop = new Properties();
  const sheet = new DomainsSheet({sheetId: prop.sheetId, domainsSheetName: prop.domainsSheet});
  const expirations = sheet.getDomainExpirations();
  const arounds = expirations.filter(record => {
    return !record.expiration || new Date(record.expiration).getTime() <= _targetDate().getTime()
  });
  const slack = new Slack({accessToken: prop.slackAccessToken, channelId: prop.slackChannelId});

  // @NOTE: Slack通知
  arounds.forEach(record => {
    if (!record.expiration) return;
    if (record.ignoreRecent || record.ignorePermanent) return;
    slack.postDomainExpireRemindMessage(
      'DomainExpireReminder',
      `${record.domain} のドメイン有効期限が ${record.expiration} に到来するようです。`,
      SLACKBOT_ICON
    );
  });

  // @NOTE: シート更新
  // @TODO: 通知されるようになってからずっとシートの期限日更新するが、ほんとは過ぎてからでいいんじゃないか
  const whois = arounds.map((record, i) => {
    return { domain: record.domain, result: new Whois(record.domain).query() };
  });
  whois.forEach(record => {
    let expirationDate:string = record.result.expiration.replace(/T.*$/, '');
    const ymd:number[] = expirationDate.split(/[-\/]/).map(Number);
    ymd[1] = ymd[1] - 1;
    // @OPTIMIZE: spread演算子にするとなんかtscがエラー吐く
    const d = new Date(ymd[0], ymd[1], ymd[2]);
    const latest = sheet.getExpiration(record.domain);
    if (latest !== _formatDate(d)) {
      sheet.setExpiration(_formatDate(d), record.domain);
      sheet.setStatus(record.result.status, record.domain);
      sheet.setIgnoreRecent('', record.domain);
    }
  });

}

/** 本日の1ヶ月後の日付を得る */
function _targetDate ():Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

function _formatDate (date:Date):string {
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');
}

// スプレッドシート1行目のタイトルを入れとく。これを元に書き込む列とかを得るので
const DOMAIN_TITLE:string = 'ドメイン';
const EXPIRATION_TITLE:string = 'ドメイン有効期限';
const STATUS_TITLE:string = '状態';
const IGNORE_RECENT:string = '今回のみ通知しない';
const IGNORE_PERMANENT:string = '通知しない';

interface DomainExpiration {
  domain:string;
  expiration:string;
  ignoreRecent:boolean;
  ignorePermanent:boolean;
}

export class DomainsSheet {

  book:GoogleAppsScript.Spreadsheet.Spreadsheet;
  domainsSheet:GoogleAppsScript.Spreadsheet.Sheet;
  domains:string[];
  expirationColumn:string;
  domainColumn:string;
  statusColumn:string;
  ignoreRecentColumn:string;
  ignorePermanentColumn:string;
  domainExpirations:DomainExpiration[];

  constructor(private params) {
    if (!params.sheetId) {
      throw new Error('Required property was not specified.');
    }
    this.book = SpreadsheetApp.openById(params.sheetId);
    if (!params.domainsSheetName) {
      throw new Error('Required property was not specified.');
    }
    this.domainsSheet = this.book.getSheetByName(params.domainsSheetName);

    // @NOTE: 列番号探して保管しとく
    this.expirationColumn = this._findColumnColLetter(EXPIRATION_TITLE);
    this.domainColumn = this._findColumnColLetter(DOMAIN_TITLE);
    this.statusColumn = this._findColumnColLetter(STATUS_TITLE);
    this.ignoreRecentColumn = this._findColumnColLetter(IGNORE_RECENT);
    this.ignorePermanentColumn = this._findColumnColLetter(IGNORE_PERMANENT);
  }

  /** ドメイン名を得る */
  public getDomains():string[] {
    const lastRow = this.domainsSheet.getLastRow();
    this.domains = this.domainsSheet
      .getRange(`${this.domainColumn}1:${this.domainColumn}${lastRow}`)
      .getValues()
      .map(val => val[0])
      .filter(value => { return value != DOMAIN_TITLE });
    return this.domains;
  }

  /** ドメインと期限日と通知設定を得る */
  public getDomainExpirations():DomainExpiration[] {
    const lastRow = this.domainsSheet.getLastRow();
    this.domainExpirations = this.domainsSheet
      .getRange(`${this.domainColumn}1:${this.ignorePermanentColumn}${lastRow}`)
      .getValues()
      .filter(value => { return value[this._columnLetterToNumber(this.domainColumn)] != DOMAIN_TITLE })
      .map(record => {
        return {
          domain: record[this._columnLetterToNumber(this.domainColumn)],
          expiration: record[this._columnLetterToNumber(this.expirationColumn)],
          ignoreRecent: !!record[this._columnLetterToNumber(this.ignoreRecentColumn)],
          ignorePermanent: !!record[this._columnLetterToNumber(this.ignorePermanentColumn)],
        }
      });
    return this.domainExpirations;
  }

  public getExpiration(domain: string):string {
    return this._getTargetRangeFromDomain('expiration', domain).getValue();
  }

  /** 指定ドメインの期限日列に書き込む */
  public setExpiration(value: string, domain: string):void {
    this._getTargetRangeFromDomain('expiration', domain).setValue(value);
  }

  /** 指定ドメインの status 列に書き込む */
  public setStatus(value: boolean, domain: string):void {
    this._getTargetRangeFromDomain('status', domain).setValue(value.toString());
  }

  /** 指定ドメインの 今回のみ通知しない 列に書き込む */
  public setIgnoreRecent(value: string, domain: string):void {
    this._getTargetRangeFromDomain('ignoreRecent', domain).setValue(value);
  }

  /**
  * 指定ドメインの指定列のrangeを得る
  * @param article 列指定 expiration | status | ignoreRecent
  * @param domain ドメイン名
  * @return Range
  */
  private _getTargetRangeFromDomain(article: string, domain: string):GoogleAppsScript.Spreadsheet.Range {
    const row = this._findColumnRowNumber(domain);
    let range: GoogleAppsScript.Spreadsheet.Range;
    switch(article) {
      case 'expiration':
        range = this.domainsSheet.getRange(`${this.expirationColumn}${row}`);
        break;
      case 'status':
        range = this.domainsSheet.getRange(`${this.statusColumn}${row}`);
        break;
      case 'ignoreRecent':
        range = this.domainsSheet.getRange(`${this.ignoreRecentColumn}${row}`);
        break;
    }
    return range;
  }

  /** 指定ワードのカラムを検索しA1形式アドレスを得る */
  private _findColumnAddress(word:string):string {
    const finder = this.domainsSheet.createTextFinder(word);
    const results = finder.findAll();
    return results[0].getA1Notation();
  }

  /** 指定ワードのカラムの列名アルファベットを得る */
  // @FIXME: 1桁列にしか対応していません。AA,AB... とかは今の所使う予定もないので。
  private _findColumnColLetter(word:string):string {
    return this._findColumnAddress(word).split('').shift();
  }

  /** 指定ワードのカラムの行番号を得る */
  private _findColumnRowNumber(word:string):number {
    return Number(this._findColumnAddress(word).split('').pop());
  }

  /** 列名アルファベットを数値に変換する */
  // @FIXME: 1桁列にしか対応していません。AA,AB... とかは今の所使う予定もないので。
  private _columnLetterToNumber(letter:string):number {
    if (letter.length <= 0 && letter.length > 1)
      throw new Error('argument must be one character.');
    return (letter.toUpperCase().charCodeAt(0) - 65);
  }

};

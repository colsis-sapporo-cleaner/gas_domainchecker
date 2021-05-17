type WhoisParsed = {
  expiration: string;
  status: boolean;
  registration: string;
}

type WhoisItemMap = {
  jp: WhoisItem;
  com: WhoisItem;
}

type WhoisItem = {
  expiration: RegExp;
  registration: RegExp;
  status: RegExp;
}


const WHOIS_PROXY: string = 'http://api.whoisproxy.info/whois/';
// @TODO: たぶんもっと充実させないとイカンしjpだけでも複数フォーマットありそう。しらんけど
const ITEMMAP:WhoisItemMap = {
  jp: {
    expiration: new RegExp(/有効期限/),
    registration: new RegExp(/登録年月日/),
    status: new RegExp(/状態/),
  },
  com: {
    expiration: new RegExp(/Registrar Registration Expiration Date/),
    registration: new RegExp(/Creation Date/),
    status: new RegExp(/Domain Status/),
  },
};


export class Whois {

  tld:string;

  // @FIXME
  private whois:any;
  private parsed:WhoisParsed;

  constructor (private domain:string) {
    this.tld = this.domain.match(/[^.]+$/).shift();
  }

  query ():WhoisParsed {
    this._query(this.domain);
    return this.parsed;
  }

  private _query (domain: string): void {
    const res = UrlFetchApp.fetch(WHOIS_PROXY + domain);
    this.whois = JSON.parse(res.getContentText());
    this.parsed = this._parse();
  }

  _parse ():WhoisParsed {
    return this.whois.results.raw
      .filter(val => {
        // @FIXME: tscがなんかエラー吐くので分割してanyに
//        return Object.values(ITEMMAP[this.tld]).some(reg => { return reg.test(val); });
        const values:any = Object.values(ITEMMAP[this.tld]);
        return values.some(reg => { return reg.test(val); });
      })
      .map(val => {
        const key = Object.keys(ITEMMAP[this.tld])
          .filter((key) => { return ITEMMAP[this.tld][key].test(val); })
          .shift();
        if (key === 'status') {
          const v = (val.split(/\s+/))[1];
          return {[key]: /(?:ok|active)/i.test(v)};
        } else {
          return {[key]: (val.split(/\s+/))[1]};
        }
      })
      .reduce((acc, val) => {
        acc[Object.keys(val).shift()] = Object.values(val).shift();
        return acc;
      });
  }

};

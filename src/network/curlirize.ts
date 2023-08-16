import { VConsoleNetworkRequestItem } from "./requestItem";
import * as tool from '../lib/tool';

/**
 * HTTP 请求方法
 */
const enum METHOD {
  OPTIONS = 'OPTIONS',
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  TRACE = 'TRACE',
  CONNECT = 'CONNECT',
  PATCH = 'PATCH',
}

type IMethod =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'trace'
  | 'TRACE'
  | 'connect'
  | 'CONNECT'
  | 'patch'
  | 'PATCH';

interface ICurlHttpConfig {
  url: string;
  method: IMethod;
  header: any;
  params: any;
  data: any;
}

class Curl {
  http: ICurlHttpConfig = {
    url: '',
    method: METHOD.GET,
    header: {},
    params: {},
    data: {},
  };

  constructor(curlHttpConfig: ICurlHttpConfig) {
    this.http = curlHttpConfig;
  }

  /**
   * 获取请求头
   * @returns
   */
  getHeaders(): string {
    if (!this.http.header) {
      return '';
    }
    let curlHeaders = '';
    Object.keys(this.http.header).forEach(property => {
      const header = `${property}:${this.http.header[property]}`;
      curlHeaders = `${curlHeaders} -H "${header}"`;
    });
    return curlHeaders.trim();
  }

  /**
   * 获取请求方法
   * @returns
   */
  getMethod(): string {
    return `-X ${this.http.method?.toUpperCase()}`;
  }

  /**
   * 获取body
   * @returns
   */
  getBody(): string {
    if (
      typeof this.http.data !== 'undefined' &&
      this.http.data !== '' &&
      this.http.data !== null &&
      this.http.method.toUpperCase() !== METHOD.GET
    ) {
      const data =
        typeof this.http.data === 'object' || Object.prototype.toString.call(this.http.data) === '[object Array]'
          ? tool.safeJSONStringify(this.http.data, { standardJSON: true })
          : this.http.data;
      return `--data '${data}'`.trim();
    }
    return '';
  }

  /**
   * 获取url
   * @returns
   */
  getUrl(): string {
    return this.http.url || '';
  }

  /**
   * 获取查询字符串
   * @returns
   */
  getQueryString(): string {
    if (!this.http.params) {
      return '';
    }
    const url = this.getUrl();
    const urlObj: Record<string, string> = {};
    if (url?.length && url.includes('?')) {
      const index = url.indexOf('?');
      const searchStr = url.substring(index + 1);
      if (searchStr.length) {
        const arr = searchStr.split('&');
        arr.forEach(item => {
          if (item && item.split('=')) {
            const [key, value] = item.split('=');
            if (key) {
              urlObj[key] = value;
            }
          }
        });
      }
    }
    let params = '';
    const newVal = {
      ...urlObj,
      ...(this.http.params || {}),
    };
    Object.keys(newVal).forEach((property, index) => {
      params +=
        index !== 0 ? `&${property}=${this.http.params[property]}` : `?${property}=${this.http.params[property]}`;
    });
    return params;
  }

  /**
   * 构建url
   * @returns
   */
  getBuiltURL() {
    let url = this.getUrl();
    if (this.getQueryString() !== '' && url.includes('?')) {
      url = url.substring(0, url.indexOf('?'));
      url += this.getQueryString();
    }
    return url.trim();
  }

  /**
   * 生成curl命令
   * @returns
   */
  generateCommand() {
    return `curl ${this.getMethod()} "${this.getBuiltURL()}" ${this.getHeaders()} ${this.getBody()}`
      .trim()
      .replace(/\s{2,}/g, ' ');
  }
}

/**
 * 获取curl 命令
 * @param curlHttpConfig
 * @returns
 */
export const getCurlCommand = (req: VConsoleNetworkRequestItem): string => {
  try {
    const curlHttpConfig = {
      url: req.url,
      method: req.method,
      params: req.getData,
      data: req.postData,
      header: req.requestHeader,
    } as ICurlHttpConfig;
    const curl = new Curl(curlHttpConfig);
    return curl.generateCommand();
  } catch (error) {
    console.error('error', error);
    return '获取curl失败';
  }
};

type PageRecord = {
  title: string;
  date: string;
  updated: string;
  weight: number;
  extra: {
    source: string;
    ratio: number;
    size: number;
  };
}

type Status = {
  status: 'awaiting' | 'running' | 'complete' | 'failed';
  url: string;
}

type Metric = {
  scores: {
    pageWeight: number;
    requests: number;
    domComplexity: number;
    javascriptComplexity: number;
    badJavascript: number;
    jQuery: number;
    cssComplexity: number;
    badCSS: number;
    fonts: number;
    serverConfig: number;
    globalScore: number;
  };
  metrics: {
    requests: number;
    bodySize: number;
    contentLength: number;
    htmlSize: number;
    cssSize: number;
    jsSize: number;
    jsonSize: number;
    imageSize: number;
    videoSize: number;
    webfontSize: number;
    base64Size: number;
    otherSize: number;
  }
}

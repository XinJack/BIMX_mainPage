require('./check-versions')()

var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

var app = express()
var compiler = webpack(webpackConfig)
var axios = require('axios')

app.get('/api/models', function(req, res){
  res.json({ 'code': 'success',
    // 地下室管线综合
    'data': [{'modelName': '\u5730\u4e0b\u5ba4\u7ba1\u7ebf\u7efc\u5408', 'modelId': '1145397448384704', 'modelType': 'normal', 'allow': 'admin'},
              {'modelName': '青岛奥体中心', 'modelId': '1145408766607552', 'modelType': 'normal', 'allow': 'admin'},
              {'modelName': '一层水暖电', 'modelId': '1145419700183264', 'modelType': 'integrate', 'allow': 'admin'},
              {'modelName': '教学楼带摄像头', 'modelId': '1139553661640896', 'modelType': 'normal', 'allow': 'admin'},
              {'modelName': '中德节能示范综合模型', 'modelId': '1145391997272288', 'modelType': 'integrate', 'allow': 'guest'},
              {'modelName': '中德电气', 'modelId': '1145378607915200', 'modelType': 'normal', 'allow': 'guest'},
              {'modelName': '中德钢结构模型', 'modelId': '1145378691735744', 'modelType': 'normal', 'allow': 'guest'},
              {'modelName': '中德混凝土模型', 'modelId': '1145379277955264', 'modelType': 'normal', 'allow': 'guest'},
              {'modelName': '中德给排水', 'modelId': '1145378983043264', 'modelType': 'normal', 'allow': 'guest'},
              {'modelName': '中德建筑', 'modelId': '1145379400925376', 'modelType': 'normal', 'allow': 'guest'},
              {'modelName': '中德暖通', 'modelId': '1145379728531648', 'modelType': 'normal', 'allow': 'guest'}
  ]
  });
});

app.get('/api/viewToken', function(req, res){
  var modelId = req.query.modelId;
  var modelType = req.query.modelType;
  console.log(modelId, modelType);
  axios.get('http://localhost:5000/api/viewToken?modelId='+modelId+'&modelType='+modelType)
    .then((response) => {
    console.log(response.data);
    res.json(response.data);
  }).catch((err) => {
    console.log(err);
    res.json({});
  })
});

app.get('/api/tree', function(req, res){
  var modelId = req.query.modelId;
  axios.get('http://localhost:5000/api/tree?modelId='+modelId)
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    }).catch((err) => {
    console.log(err);
    res.json({});
  })
});

app.get('/api/integrateTree', function(req, res){
  var modelId = req.query.modelId;
  axios.get('http://localhost:5000/api/integrateTree?modelId='+modelId)
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    }).catch((err) => {
    console.log(err);
    res.json({});
  })
});

app.get('/api/elementInfo', function(req, res){
  var modelId = req.query.modelId;
  var elementId = req.query.elementId;
  axios.get('http://localhost:5000/api/elementInfo?modelId='+modelId+'&elementId='+elementId)
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    }).catch((err) => {
    console.log(err);
    res.json({});
  })
});

app.get('/api/integrateElementInfo', function(req, res){
  var modelId = req.query.modelId;
  var fileId = req.query.fileId;
  var elementId = req.query.elementId;
  axios.get('http://localhost:5000/api/integrateElementInfo?modelId='+modelId+'&fileId='+fileId+'&elementId='+elementId)
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    }).catch((err) => {
      console.log(err);
      res.json({});
  })
});

app.get('/logout', function(req, res){
  axios.get('http://localhost:5000/logout')
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    }).catch((err) => {
    console.log(err);
    res.json({});
  })
});

app.get('/api/video', function(req, res){
  var modelId = req.query.modelId;
  var objectId = req.query.objectId;
  axios.get('http://localhost:5000/api/video?modelId='+modelId+'&objectId='+objectId)
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    }).catch((err) => {
      console.log(err);
      res.json({});
  })
});

app.get('/api/data', function(req, res){
  var modelId = req.query.modelId;
  var objectId = req.query.objectId;
  var type = req.query.type;
  axios.get('http://localhost:5000/api/data?modelId='+modelId+'&objectId='+objectId+'&type='+type)
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    }).catch((err) => {
      console.log(err);
      res.json({});
    });
});

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {}
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}

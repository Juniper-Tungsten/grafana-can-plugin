'use strict';

System.register(['lodash', './common'], function (_export, _context) {
  "use strict";

  var _, Common, _createClass, GenericDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_common) {
      Common = _common.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('GenericDatasource', GenericDatasource = function () {
        function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, GenericDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          if (instanceSettings.jsonData !== undefined) {
            this.keystoneUrl = instanceSettings.jsonData.keystoneUrl;
            this.canUsername = instanceSettings.jsonData.canUsername;
            this.canPassword = instanceSettings.jsonData.canPassword;
            this.canTenant = instanceSettings.jsonData.canTenant;
            this.instanceSettings = instanceSettings;
          }
          this.authToken = null;
          this.metrics = null;
          this.authTokenExpire = null;
        }

        _createClass(GenericDatasource, [{
          key: 'query',
          value: function query(options) {
            var queryArray = this.buildQueryParameters(options);
            if (!queryArray) {
              return this.q.when({ data: [] });
            }
            var promiseArray = [];
            for (var i in queryArray) {
              var paramObj = {};
              paramObj.url = this.url + Common.endpoints.query;
              paramObj.data = queryArray[i];
              var p = this.analyticsQuery(paramObj);
              promiseArray[i] = p;
            }
            return this.q.all(promiseArray).then(function (allData) {
              var returnObj = { data: [] };
              for (var _i in allData) {
                returnObj.data[_i] = Common.processResultData(allData[_i]);
              }
              return returnObj;
            });
          }
        }, {
          key: 'setAuthToken',
          value: function setAuthToken() {
            var _this = this;

            var forceRenew = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (!forceRenew && this.authToken != null && (this.authTokenExpire - Date.now()) / 1000 > 0) {
              return this.q.when({ token: this.authToken });
            }
            var authDict = Common.getAuthDict(this.canUsername, this.canPassword, this.canTenant);
            return this.backendSrv.datasourceRequest({
              url: this.keystoneUrl,
              method: 'POST',
              data: authDict,
              headers: { 'Content-Type': 'application/json' }
            }).then(function (response) {
              var pResp = Common.processAuthResponse(response);
              if (pResp != null) {
                _this.authToken = pResp.token;
                _this.authTokenExpire = Date.parse(pResp.expire);
                return { token: _this.authToken };
              }
              return { token: null };
            });
          }
        }, {
          key: 'testDatasource',
          value: function testDatasource() {
            var _this2 = this;

            return this.setAuthToken().then(function (resp) {
              if (!resp.token) {
                return undefined;
              }
              var paramObj = {};
              paramObj.url = _this2.url + Common.endpoints.query;
              paramObj.token = resp.token;
              return _this2.analyticsQuery(paramObj);
            }).then(function (resp) {
              if (resp === undefined || resp.status !== 200) {
                return { status: 'failure', message: 'Unable to reach keystone or api server', title: 'Failure' };
              }
              return { status: 'success', message: 'Data source is working', title: 'Success' };
            });
          }
        }, {
          key: 'annotationQuery',
          value: function annotationQuery(options) {
            if (!options.annotation || !options.annotation.enable) {
              return this.q.when([]);
            }
            var annotationObj = {};
            var reqMethod = 'POST';
            var reqUrl = this.url + Common.endpoints.query;
            if (options.annotation.alarm) {
              reqUrl = this.url + Common.endpoints.alarm + '/' + options.annotation.alarmUVEName + '/' + options.annotation.alarmNodeName + '?cfilt=UVEAlarms';
              reqMethod = 'GET';
            } else {
              var validWhere = Common.filterQueryFields(options.annotation).where;
              var validFilter = Common.filterQueryFields({
                advanced: options.annotation.advanced,
                whereArray: [options.annotation.filterArray] }).where;
              validWhere = Common.transform({ where: validWhere }).where || [[{ 'name': 'Source', 'value': '', 'op': 7 }]];
              validFilter = Common.transform({ where: validFilter }).where;
              annotationObj = {
                start_time: Common.toDate(options.range.from),
                end_time: Common.toDate(options.range.to),
                select_fields: Common.annotationColAll,
                table: Common.annotationTable,
                where: validWhere
              };
              if (validFilter) {
                annotationObj.filter = validFilter[0];
              }
            }
            var paramObj = {
              url: reqUrl,
              data: annotationObj,
              method: reqMethod
            };
            return this.analyticsQuery(paramObj).then(function (res) {
              return Common.processAnnotationResult(res, options.annotation);
            });
          }
        }, {
          key: 'analyticsQuery',
          value: function analyticsQuery(params) {
            var _this3 = this;

            var apiEndpoint = params.url;
            var method = params.method || 'POST';
            var headers = params.headers || {};
            var reqObj = {};
            if (method === 'POST') {
              if (!params.data) {
                reqObj.end_time = params.end || 'now'; // new Date().getTime();
                reqObj.start_time = params.start || 'now-10m'; // req_obj.end_time - 600000;
                reqObj.select_fields = params.select || ['name', 'fields.value'];
                reqObj.table = params.table || Common.allTableTableName;
                reqObj.where = params.where || [[{ 'name': 'name', 'value': 'STAT', 'op': 7 }]];
              } else {
                reqObj = params.data;
              }
              headers['Content-Type'] = headers['Content-Type'] || 'application/json';
            }
            headers['X-Auth-Token'] = headers['X-Auth-Token'] || params.token;
            return this.setAuthToken().then(function (x) {
              var callObj = {
                url: apiEndpoint,
                method: method,
                headers: headers
              };
              if (method === 'POST') {
                callObj.data = reqObj;
              }
              callObj.headers['X-Auth-Token'] = callObj.headers['X-Auth-Token'] || x.token;
              return _this3.backendSrv.datasourceRequest(callObj);
            });
          }
        }, {
          key: 'metricFindQuery',
          value: function metricFindQuery(param) {
            // TODO: build optimization to cache tables
            var paramObj = {};
            paramObj.url = this.url + Common.endpoints.query;
            paramObj.table = Common.allTableTableName;
            paramObj.select = ['name', 'fields.value'];
            paramObj.where = [[{ 'name': 'name', 'value': 'STAT', 'op': 7 }]];
            paramObj.start = param.start || 'now-10m'; // req_obj.end_time - 600000;
            paramObj.end = param.end || 'now'; // new Date().getTime();

            return this.analyticsQuery(paramObj).then(this.mapToTextValue);
          }
        }, {
          key: 'mapToTextValue',
          value: function mapToTextValue(result) {
            return _.map(result.data.value, function (d, i) {
              return { text: d['fields.value'], value: i };
            });
          }
        }, {
          key: 'getColumns',
          value: function getColumns(tableName) {
            return this.analyticsQuery({
              url: this.url + Common.endpoints.table + '/' + tableName + Common.endpoints.tableSchema,
              method: 'GET'
            }).then(this.mapToValue);
          }
        }, {
          key: 'mapToValue',
          value: function mapToValue(schemaResult) {
            var filtered = [];
            var unfiltered = [];
            var allCols = schemaResult.data.columns;

            var filteredCols = _.filter(schemaResult.data.columns, function (col) {
              return Common.numTypes.indexOf(col.datatype.toLowerCase()) > -1 && Common.filteredCol.indexOf(col.name.toLowerCase()) < 0;
            });
            _.each(filteredCols, function (d, i) {
              filtered[i] = { text: d.name, type: d.datatype, value: i, index: d.index };
            });
            _.each(allCols, function (d, i) {
              unfiltered[i] = { text: d.name, type: d.datatype, value: i, index: d.index };
            });
            return { filtered: filtered, unfiltered: unfiltered };
          }
        }, {
          key: 'buildQueryParameters',
          value: function buildQueryParameters(options) {
            var _this4 = this;

            options.targets = _.filter(options.targets, function (target) {
              return !target.hide && target.table && target.table !== Common.strings.selectTable && target.selCol && target.selCol !== Common.strings.selectColumn;
            });
            var retVal = [];
            _.each(options.targets, function (target, i) {
              target = Common.filterQueryFields(target);
              if (!Common.isValidQuery(target)) {
                return false;
              }
              target = Common.transform(target);
              var toTime = Common.toDate(options.range.to);
              var fromTime = Common.toDate(options.range.from);
              toTime = Math.round(toTime);
              fromTime = Math.round(fromTime);
              var timeCol = 'T';
              var isAggField = Common.isAggregateField(target.selCol);
              if (isAggField === true) {
                timeCol = 'T=' + (options.intervalMs || 60000) / 1000;
              }
              var qObj = {
                'table': _this4.templateSrv.replace(target.table),
                'start_time': fromTime,
                'end_time': toTime,
                'select_fields': [timeCol, target.selCol],
                'where': target.where || [[{ 'name': 'name', 'value': '', 'op': 7 }]],
                'limit': options.maxDataPoints || 1000
              };
              if (target.filter && isAggField !== true) {
                qObj.filter = target.filter;
              }
              retVal.push(qObj);
            });
            // options.targets = targets;
            return retVal;
          }
        }]);

        return GenericDatasource;
      }());

      _export('GenericDatasource', GenericDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map

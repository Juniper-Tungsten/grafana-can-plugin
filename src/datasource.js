// The MIT License (MIT)

// Copyright (c) 2016 Grafana
// Copyright 2017, Juniper Networks, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import _ from 'lodash';
import Common from './common';
export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
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

  query(options) {
    let queryArray = this.buildQueryParameters(options);
    if (!queryArray) {
      return this.q.when({data: []});
    }
    let promiseArray = [];
    for (let i in queryArray) {
      let paramObj = {};
      paramObj.url = this.url + Common.endpoints.query;
      paramObj.data = queryArray[i];
      let p = this.analyticsQuery(paramObj);
      promiseArray[i] = p;
    }
    return this.q.all(promiseArray).then((allData) => {
      let returnObj = {data: []};
      for (let i in allData) { returnObj.data[i] = Common.processResultData(allData[i]); }
      return returnObj;
    });
  }

  setAuthToken(forceRenew = false) {
    if (!forceRenew && this.authToken != null && (this.authTokenExpire - Date.now()) / 1000 > 0) { return this.q.when({token: this.authToken}); }
    let authDict = Common.getAuthDict(this.canUsername, this.canPassword, this.canTenant);
    return this.backendSrv.datasourceRequest({
      url: this.keystoneUrl,
      method: 'POST',
      data: authDict,
      headers: { 'Content-Type': 'application/json' }
    }).then((response) => {
      let pResp = Common.processAuthResponse(response);
      if (pResp != null) {
        this.authToken = pResp.token;
        this.authTokenExpire = Date.parse(pResp.expire);
        return {token: this.authToken};
      }
      return {token: null};
    });
  }

  testDatasource() {
    return this.setAuthToken()
    .then((resp) => {
      if (!resp.token) { return undefined; }
      let paramObj = {};
      paramObj.url = this.url + Common.endpoints.query;
      paramObj.token = resp.token;
      return this.analyticsQuery(paramObj);
    })
    .then((resp) => {
      if (resp === undefined || resp.status !== 200) {
        return {status: 'failure', message: 'Unable to reach keystone or api server', title: 'Failure'};
      }
      return {status: 'success', message: 'Data source is working', title: 'Success'};
    });
  }

  annotationQuery(options) {
    if (!options.annotation || !options.annotation.enable) {
      return this.q.when([]);
    }
    let annotationObj = {};
    let reqMethod = 'POST';
    let reqUrl = this.url + Common.endpoints.query;
    if (options.annotation.alarm) {
      reqUrl = this.url +
                Common.endpoints.alarm +
                '/' +
                options.annotation.alarmUVEName +
                '/' +
                options.annotation.alarmNodeName +
                '?cfilt=UVEAlarms';
      reqMethod = 'GET';
    } else {
      let validWhere = Common.filterQueryFields(options.annotation).where;
      let validFilter = Common.filterQueryFields({
        advanced: options.annotation.advanced,
        whereArray: [options.annotation.filterArray]}).where;
      validWhere = Common.transform({where: validWhere}).where || [[{'name': 'Source', 'value': '', 'op': 7}]];
      validFilter = Common.transform({where: validFilter}).where;
      annotationObj = {
        start_time: Common.toDate(options.range.from),
        end_time: Common.toDate(options.range.to),
        select_fields: Common.annotationColAll,
        table: Common.annotationTable,
        where: validWhere
      };
      if (validFilter) { annotationObj.filter = validFilter[0]; }
    }
    let paramObj = {
      url: reqUrl,
      data: annotationObj,
      method: reqMethod
    };
    return this.analyticsQuery(paramObj).then((res) => {
      return Common.processAnnotationResult(res, options.annotation);
    });
  }

  analyticsQuery(params) {
    let apiEndpoint = params.url;
    let method = params.method || 'POST';
    let headers = params.headers || {};
    let reqObj = {};
    if (method === 'POST') {
      if (!params.data) {
        reqObj.end_time = params.end || 'now';// new Date().getTime();
        reqObj.start_time = params.start || 'now-10m';// req_obj.end_time - 600000;
        reqObj.select_fields = params.select || ['name', 'fields.value'];
        reqObj.table = params.table || Common.allTableTableName;
        reqObj.where = params.where || [[{'name': 'name', 'value': 'STAT', 'op': 7}]];
      } else { reqObj = params.data; }
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    headers['X-Auth-Token'] = headers['X-Auth-Token'] || params.token;
    return this.setAuthToken().then((x) => {
      let callObj = {
        url: apiEndpoint,
        method: method,
        headers: headers
      };
      if (method === 'POST') { callObj.data = reqObj; }
      callObj.headers['X-Auth-Token'] = callObj.headers['X-Auth-Token'] || x.token;
      return this.backendSrv.datasourceRequest(callObj);
    });
  }

  metricFindQuery(param) {
    // TODO: build optimization to cache tables
    let paramObj = {};
    paramObj.url = this.url + Common.endpoints.query;
    paramObj.table = Common.allTableTableName;
    paramObj.select = ['name', 'fields.value'];
    paramObj.where = [[{'name': 'name', 'value': 'STAT', 'op': 7}]];
    paramObj.start = param.start || 'now-10m';// req_obj.end_time - 600000;
    paramObj.end = param.end || 'now';// new Date().getTime();

    return this.analyticsQuery(paramObj)
           .then(this.mapToTextValue);
  }

  mapToTextValue(result) {
    return _.map(result.data.value, (d, i) => {
      return { text: d['fields.value'], value: i};
    });
  }

  getColumns(tableName) {
    return this.analyticsQuery({
      url: this.url + Common.endpoints.table + '/' + tableName + Common.endpoints.tableSchema,
      method: 'GET'
    }).then(this.mapToValue);
  }

  mapToValue(schemaResult) {
    let filtered = [];
    let unfiltered = [];
    let allCols = schemaResult.data.columns;

    let filteredCols = _.filter(schemaResult.data.columns, (col) => {
      return Common.numTypes.indexOf(col.datatype.toLowerCase()) > -1 &&
             Common.filteredCol.indexOf(col.name.toLowerCase()) < 0;
    });
    _.each(filteredCols, (d, i) => {
      filtered[i] = {text: d.name, type: d.datatype, value: i, index: d.index};
    });
    _.each(allCols, (d, i) => {
      unfiltered[i] = {text: d.name, type: d.datatype, value: i, index: d.index};
    });
    return {filtered: filtered, unfiltered: unfiltered};
  }

  buildQueryParameters(options) {
    options.targets = _.filter(options.targets, (target) => {
      return !target.hide &&
             target.table &&
             target.table !== Common.strings.selectTable &&
             target.selCol &&
             target.selCol !== Common.strings.selectColumn;
    });
    let retVal = [];
    _.each(options.targets, (target, i) => {
      target = Common.filterQueryFields(target);
      if (!Common.isValidQuery(target)) { return false; }
      target = Common.transform(target);
      let toTime = Common.toDate(options.range.to);
      let fromTime = Common.toDate(options.range.from);
      toTime = Math.round(toTime);
      fromTime = Math.round(fromTime);
      let timeCol = 'T';
      let isAggField = Common.isAggregateField(target.selCol);
      if (isAggField === true) {
        timeCol = 'T=' + ((options.intervalMs || 60000) / 1000);
      }
      let qObj = {
        'table': this.templateSrv.replace(target.table),
        'start_time': fromTime,
        'end_time': toTime,
        'select_fields': [timeCol, target.selCol],
        'where': target.where || [[{'name': 'name', 'value': '', 'op': 7}]],
        'limit': options.maxDataPoints || 1000
      };
      if (target.filter && isAggField !== true) { qObj.filter = target.filter; }
      retVal.push(qObj);
    });
    // options.targets = targets;
    return retVal;
  }
}

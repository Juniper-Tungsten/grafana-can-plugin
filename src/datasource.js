//  Copyright 2017, Juniper Networks, Inc.

//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

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
    let authDict = Common.getAuthDict(this.canUsername, this.canPassword);
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
      paramObj.table = Common.allTableTableName;
      paramObj.select = ['name', 'fields.value'];
      paramObj.where = [[{'name': 'name', 'value': 'STAT', 'op': 7}]];
      paramObj.start = 'now-10m';
      paramObj.end = 'now';
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
    let query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
    let annotationQuery = {
      range: options.range,
      annotation: {
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
        query: query
      },
      rangeRaw: options.rangeRaw
    };

    return this.backendSrv.datasourceRequest({
      url: this.url + '/annotations',
      method: 'POST',
      data: annotationQuery
    }).then((result) => {
      return result.data;
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

    schemaResult.data.columns = _.filter(schemaResult.data.columns, (col) => {
      return Common.numTypes.indexOf(col.datatype.toLowerCase()) > -1 &&
             Common.filteredCol.indexOf(col.name.toLowerCase()) < 0;
    });
    _.each(schemaResult.data.columns, (d, i) => {
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
      let qObj = {
        'table': this.templateSrv.replace(target.table),
        'start_time': fromTime,
        'end_time': toTime,
        'select_fields': ['T', target.selCol],
        'where': target.where || [[{'name': 'name', 'value': '', 'op': 7}]],
        'limit': options.maxDataPoints || 1000
      };
      if (target.filter) { qObj.filter = target.filter; }
      retVal.push(qObj);
    });
    // options.targets = targets;
    return retVal;
  }
}

import _ from 'lodash';
import {Common} from './common';
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
    let query_array = this.buildQueryParameters(options);
    if (!query_array) {
      return this.q.when({data: []});
    }
    let promise_array = [];
    for (let i in query_array) {
      let param_obj = {};
      param_obj.url = this.url + Common.endpoints.query;
      param_obj.data = query_array[i];
      let p = this.analyticsQuery(param_obj);
      promise_array[i] = p;
    }
    return this.q.all(promise_array).then((allData) => {
      let return_obj = {data: []};
      for (let i in allData) { return_obj.data[i] = Common.processResultData(allData[i]); }
      return return_obj;
    });
  }

  setAuthToken(forceRenew = false) {
    if (!forceRenew && this.authToken != null && (this.authTokenExpire - Date.now()) / 1000 > 0) { return this.q.when({token: this.authToken}); }
    let auth_dict = Common.getAuthDict(this.canUsername, this.canPassword);
    return this.backendSrv.datasourceRequest({
      url: this.keystoneUrl,
      method: 'POST',
      data: auth_dict,
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
    return this.setAuthToken().then((resp) => {
      if (resp.token) { return {status: 'success', message: 'Data source is working', title: 'Success'}; }
      return {status: 'failure', message: 'Unable to reach keystone server', title: 'Failure'};
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
    let api_endpoint = params.url;
    let method = params.method || 'POST';
    let headers = params.headers || {};
    let req_obj = {};
    if (method === 'POST') {
      if (!params.data) {
        req_obj.end_time = params.end || 'now';// new Date().getTime();
        req_obj.start_time = params.start || 'now-10m';// req_obj.end_time - 600000;
        req_obj.select_fields = params.select || ['name', 'fields.value'];
        req_obj.table = params.table || 'StatTable.FieldNames.fields';
        req_obj.where = params.where || [[{'name': 'name', 'value': 'STAT', 'op': 7}]];
      } else { req_obj = params.data; }
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    headers['X-Auth-Token'] = headers['X-Auth-Token'] || params.token;
    return this.setAuthToken().then((x) => {
      let call_obj = {
        url: api_endpoint,
        method: method,
        headers: headers
      };
      if (method === 'POST') { call_obj.data = req_obj; }
      call_obj.headers['X-Auth-Token'] = call_obj.headers['X-Auth-Token'] || x.token;
      return this.backendSrv.datasourceRequest(call_obj);
    });
  }

  findAllTables(param) {
    // TODO: build optimization to cache tables
    let param_obj = {};
    param_obj.url = this.url + Common.endpoints.query;
    param_obj.table = 'StatTable.FieldNames.fields';
    param_obj.select = ['name', 'fields.value'];
    param_obj.where = [[{'name': 'name', 'value': 'STAT', 'op': 7}]];
    param_obj.start = param.start || 'now-10m';// req_obj.end_time - 600000;
    param_obj.end = param.end || 'now';// new Date().getTime();

    return this.analyticsQuery(param_obj)
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
      let to_time = Common.toDate(options.range.to);
      let from_time = Common.toDate(options.range.from);
      to_time = Math.round(to_time);
      from_time = Math.round(from_time);
      let qObj = {
        'table': this.templateSrv.replace(target.table),
        'start_time': from_time,
        'end_time': to_time,
        'select_fields': ['T', target.selCol],
        'where': target.where || [[{'name': 'name', 'value': '', 'op': 7}]],
        'limit': options.maxDataPoints
      };
      if (target.filter) { qObj.filter = target.filter; }
      retVal.push(qObj);
    });
    console.log(options);
    // options.targets = targets;
    return retVal;
  }
}

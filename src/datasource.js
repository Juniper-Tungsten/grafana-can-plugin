import _ from "lodash";
import {Common} from './common';
export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    if (instanceSettings.jsonData !== undefined){
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
    return this.setAuthToken().then(x=>{
      var query_array = this.buildQueryParameters(options);
      if( !query_array )
        return this.q.when({data: []});
      function data_process(result){
        var newData = [];
        _.each(result.data.data, (d,i)=>{
          var time = d["T"];
            _.each(d, (v,k)=>{
              if(k != "T" && k != "CLASS(T)")
                  newData.push([v/100000,time/1000]);
            });
        });
        return {'target':result.data.queryJSON.table,'datapoints':newData};
        
        
      }
      var promise_array=[];
      for(var i in query_array){
          var p = this.backendSrv.datasourceRequest({
          url: this.url + '/api/qe/query',
          data: query_array[i],
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
                      'X-CSRF-Token': this.authToken
                   }
          });
          promise_array[i]=p;
      }
      return this.q.all(promise_array).then(allData =>{
        var return_obj={data:[]};
        for(var i in allData)
          return_obj.data[i] = data_process(allData[i]);
        return return_obj;
      });
    });    
  }

  setAuthToken(){
    //TODO: make sure setAuthToken renews the token when it expires;
    if(this.authToken != null)
      return this.q.when({data: [],token: this.authToken});
    let auth_dict = Common.getAuthDict(this.canUsername,this.canPassword);
    return this.backendSrv.datasourceRequest({
      url: this.keystoneUrl,
      method: 'POST',
      data: auth_dict,
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      let pResp = Common.processAuthResponse(response);
      if(pResp != null){
         this.authToken = pResp.token;
         this.authTokenExpire = pResp.expire;
         return { token: this.authToken, status: "success", message: "Data source is working", title: "Success",  };
      }else
         return { token: this.authToken, status: "failure", message: "Unable to reach keystone server", title: "Failure"};
    });
  }

  testDatasource() {
    return this.setAuthToken();
  }

  annotationQuery(options) {
    var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
    var annotationQuery = {
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
    }).then(result => {
      return result.data;
    });
  }

  analyticsQuery(params){
    let req_obj = {};
    req_obj.end_time = params.to || "now";//new Date().getTime();
    req_obj.start_time = params.start || "now-10m";//req_obj.end_time - 600000;
    req_obj.select_fields = params.select || ["name", "fields.value"];
    req_obj.table = params.table || "StatTable.FieldNames.fields";
    req_obj.where = params.where || [[{"name":"name","value":"STAT","op":7}]];
    let headers = params.headers || {};
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    headers['X-Auth-Token'] = headers['X-Auth-Token'] || params.token;
    let api_endpoint = params.url;
    let method = params.method || 'POST';
    return this.setAuthToken().then(x=>{
      let call_obj = {
        url: api_endpoint,
        data: req_obj,
        method: method,
        headers: headers
      };
      call_obj.headers['X-Auth-Token'] = call_obj.headers['X-Auth-Token'] || x.token;
      return this.backendSrv.datasourceRequest(call_obj);
    });
  }
  findAllTables(options) {
    //TODO: build optimization to cache tables
    var param_obj={};
    param_obj.url = this.url +Common.endpoints.query;
    param_obj.table = "StatTable.FieldNames.fields";
    param_obj.select = ["name", "fields.value"];
    param_obj.where = [[{"name":"name","value":"STAT","op":7}]];
    param_obj.start = "now-10m";//req_obj.end_time - 600000;
    param_obj.to ="now";//new Date().getTime();

    return this.analyticsQuery(param_obj)
           .then(this.mapToTextValue)
          //  .then(y => {
          //     this.metrics = y;
          //     return y;
          //   });
  }

  mapToTextValue(result) {
    return _.map(result.data.value, (d, i) => {
      return { text: d["fields.value"], value: i};
    });
  }

  getpselects(table_name){
    var api_endpoint = "/api/qe/table/schema/"+table_name;
     return this.setAuthToken().then(x => {
        return this.backendSrv.datasourceRequest({
        url: this.url + api_endpoint,
        method: 'GET',
        headers: { 'X-CSRF-Token': this.authToken }
      }).then(this.mapToValue);
    });
  }

  mapToValue(x){
    return _.map(x.data.columns, (d,i) => {
      return {text: d.name, type: d.datatype, value: i};
    });
  }

  buildQueryParameters(options) {
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    var targets = _.map(options.targets, target => {
      var to_time = options.range.to._i ;
      var from_time = options.range.from._i;
      to_time = to_time ||  new Date().getTime();
      from_time = from_time || to_time - 60000000;
      to_time = Math.round(to_time);
      from_time = Math.round(from_time);
      return {
        
        autoSort:true,
        "async":false,
        "formModelAttrs":{
          "table_name":this.templateSrv.replace(target.target),
          "table_type":"STAT",
          "query_prefix":"stat",
          "from_time":from_time,
          "from_time_utc":from_time,
          "to_time":to_time,
          "to_time_utc":to_time,
          "select":"T,"+target.selected.text,
          "time_granularity":2,
          "time_granularity_unit":"mins",
          "limit":options.maxDataPoints
        },
        chunk: 1,
        chunkSize: 10000,
        hide: target.hide
      };
    });

    // options.targets = targets;

    return targets;
  }
}

import _ from "lodash";

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    if (instanceSettings.jsonData !== undefined){
      this.keystone_url = instanceSettings.jsonData.keystone_url;
      this.can_username = instanceSettings.jsonData.can_username;
      this.can_password = instanceSettings.jsonData.can_password;
      this.instanceSettings = instanceSettings;
    }
    this.auth_token = null;
    this.metrics = null;
  }

  query(options) {
    return this.set_auth_token().then(x=>{
      var query = this.buildQueryParameters(options);
      // query.targets = query.targets.filter(t => !t.hide);

      // if (query.targets.length <= 0) {
      //   return this.q.when({data: []});
      // }
      if( !query )
        return this.q.when({data: []});
      return this.backendSrv.datasourceRequest({
        url: this.url + '/api/qe/query',
        data: query,
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                    'X-CSRF-Token': this.auth_token
                }
      });
    });    
  }

  set_auth_token(){
    var auth_dict = {username:this.can_username, password:this.can_password};
    return $.ajax({
      url: this.url + '/authenticate',
      method: 'POST',
      data: auth_dict,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).done(response => {
      // console.log('::::::::');
      // console.log(response);
      if (response._csrf) {
            this.auth_token = response._csrf;
            return { status: "success", message: "Data source is working", title: "Success" };
      }
    });
  }
  testDatasource() {
    
    // var auth_dict={auth:{
    //                       passwordCredentials:{
    //                                             username: this.can_username ,
    //                                             password: this.can_password
    //                                           },
    //                       tenantName: "admin"
    //                     }
    //               }
    var x = this.set_auth_token();
    return x;
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

  metricFindQuery(options) {
    // var dateObj = Date();
    // if (this.metrics)
    // {
    //   var x = this.metrics;
      
    // }
    var req_obj={};
    req_obj.toTimeUTC = new Date().getTime();
    req_obj.fromTimeUTC = req_obj.toTimeUTC - 600000;
    req_obj.select = ["name", "fields.value"];
    req_obj.table_name = "StatTable.FieldNames.fields";
    req_obj.where = [[{"name":"name","value":"STAT","op":7}]];
    var api_endpoint = "/api/qe/table/column/values";

    // var target = typeof (options) === "string" ? options : options.target;
    // var interpolated = {
    //     target: this.templateSrv.replace(target, null, 'regex')
    // };
    return this.set_auth_token().then(x => {
        if (this.metrics)
          return this.metrics;
        return this.backendSrv.datasourceRequest({
        url: this.url + api_endpoint,
        data: req_obj,
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                    'X-CSRF-Token': this.auth_token
                }
      }).then(this.mapToTextValue).then(y=> {
        this.metrics = y;
        return y;
      });
    });
    
  }

  mapToTextValue(result) {
    // console.log('$$$$$$');
    // console.log(result);
    
    return _.map(result.data.data, (d, i) => {
      // console.log(d);
      // console.log(i);
      return { text: d["fields.value"], value: i};
      // if (d && d.text && d.value) {
      //   return { text: d.text, value: d.value };
      // } else if (_.isObject(d)) {
      //   return { text: d, value: i};
      // }
      // else if ( d && d["fields.value"]){
      //   return { text: d["fields.value"], value: d["fields.value"]};
      // }
      // return { text: d, value: d };
    });
    // this.metrics = metrics;
    // return metrics;
   
  }
  getpselects(table_name){
    var api_endpoint = "/api/qe/table/schema/"+table_name;
     return this.set_auth_token().then(x => {
        return this.backendSrv.datasourceRequest({
        url: this.url + api_endpoint,
        method: 'GET',
        headers: { 'X-CSRF-Token': this.auth_token }
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
      var to_time = new Date().getTime();
      var from_time = to_time - 600000;
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
          "select":"T=,"+target.selected.text,
          "time_granularity":30,
          "time_granularity_unit":"mins",
          "limit":"150000"
        },
        chunk: 1,
        chunkSize: 10000,
        hide: target.hide
      };
    });

    options.targets = targets;

    return targets[0];
  }
}

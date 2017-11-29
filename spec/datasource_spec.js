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

import sinon from 'sinon';
import Q from 'q';
import {Datasource} from '../module';

describe('Contail Analytics Datasource', function () {
  let ctx = {};

  beforeEach(function () {
    // ctx.Common = Common;
    ctx.$q = Q;
    ctx.backendSrv = {};
    ctx.templateSrv = {};
    ctx.ds = new Datasource({}, ctx.$q, ctx.backendSrv, ctx.templateSrv);
  });

  it('should set the instanceSettings', function (done) {
    let instanceSettings = {
      jsonData: {
        keystoneUrl: 'thisUrl',
        canUsername: 'thisUsername',
        canPassword: 'thisPassword',
        canTenant: 'thisTenant'
      }
    };
    let ds = new Datasource(instanceSettings, ctx.$q, ctx.backendSrv, ctx.templateSrv);
    expect(ds.keystoneUrl).to.be.equal('thisUrl');
    expect(ds.canUsername).to.be.equal('thisUsername');
    expect(ds.canPassword).to.be.equal('thisPassword');
    expect(ds.canTenant).to.be.equal('thisTenant');
    expect(ds.instanceSettings).to.deep.equal(instanceSettings);
    done();
  });

  it('[query] should return an empty array when no targets are set', function (done) {
    ctx.ds.query({targets: []}).then(function (result) {
      expect(result.data).to.have.length(0);
      done();
    });
  });

  it('[query] should return the server results when a target is set', function (done) {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        target: 'X',
        data: {
          value: [{
            T: '140000000',
            val: '1234'
          },
          {
            T: '140000001',
            val: '1235'
          }
          ]
        },
        config: {data: {select_fields: ['T', 'table_name']}}
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };


    let queryObj = {
      maxDataPoints: 100,
      range: {
        from: {_d: 'Fri May 05 2017 17:43:41 GMT+0530 (IST)'},
        to: {_d: 'Fri May 05 2017 17:43:41 GMT+0530 (IST)'}
      },
      targets: [
        {
          hide: false,
          table: 'table_random',
          selCol: 'random_col'
        }
      ]
    };
    // done();
    ctx.ds.query(queryObj).then(function (result) {
      expect(result.data).to.have.length(1);
      let series = result.data[0];
      expect(series.target).to.equal('table_name');
      expect(series.datapoints).to.have.length(2);
      done();
    });
  });

  it('[testDatasource] should return success when credentials are correct', function (done) {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        status: 200,
        data: {
          access: {
            token: {id: '140000000', expires: 1497409035845}
          }
        }
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.testDatasource().then(function (result) {
      expect(result.status).to.equal('success');
      done();
    });
  });

  it('[testDatasource] should return failure when credentials are wrong', function (done) {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        status: 200,
        data: {}
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.testDatasource().then(function (result) {
      expect(result.status).to.equal('failure');
      done();
    });
  });

  it('[annotationQuery] should return empty array when annotation is disabled', function (done) {
    let input = { annotation: {enable: false} };
    ctx.ds.annotationQuery(input).then((res) => {
      expect(res).to.deep.equal([]);
      done();
    });
  });

  it('[annotationQuery] should return valid array for alarm annotation', function (done) {
    ctx.ds.url = 'customCANurl';
    let input = {
      annotation: {
        enable: true,
        alarm: true,
        alarmUVEName: 'someUveName',
        alarmNodeName: 'someNodeName'
      }
    };
    let datasourceOutput = ctx.$q.when({
      status: 200,
      data: {
        'UVEAlarms': {
          'alarms': [
            {
              'severity': 0,
              'timestamp': 1494526922339119,
              'ack': false,
              'token': 'eyJ0aW1lc3RhbXAiOiAxNDk0NTI2OTIyMzM5MTE5LCAiaHR0cF9wb3J0IjogNTk5NSwgImhvc3RfaXAiOiAiMTAuMjA5LjEuMTMifQ==',
              'type': 'default-global-system-config:system-defined-process-connectivity',
              'description': 'Process(es) reporting as non-functional.'
            },
            {
              'severity': 0,
              'timestamp': 1494526413491767,
              'ack': false,
              'token': 'eyJ0aW1lc3RhbXAiOiAxNDk0NTI2NDEzNDkxNzY3LCAiaHR0cF9wb3J0IjogNTk5NSwgImhvc3RfaXAiOiAiMTAuMjA5LjEuMTMifQ==',
              'type': 'default-global-system-config:system-defined-core-files',
              'description': 'A core file has been generated on the node.'
            }
          ]
        }
      }
    });
    let datasourceRequestMock = sinon.stub();
    datasourceRequestMock.returns(datasourceOutput);
    ctx.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.ds.annotationQuery(input).then((res) => {
      expect(datasourceRequestMock.calledTwice).to.be.true;
      expect(datasourceRequestMock.getCall(1).args[0].method).to.equal('GET');
      expect(datasourceRequestMock.getCall(1).args[0].url).to.equal('customCANurl/analytics/uves/someUveName/someNodeName?cfilt=UVEAlarms');
      done();
    });
  });

  it('[annotationQuery] should return valid array for messageTable annotation', function (done) {
    ctx.ds.url = 'customCANurl';
    let input = {
      annotation: {
        enable: true,
        advanced: true,
        name: 'someName',
        datasource: 'someDs',
        titleMapping: 'Source',
        textMapping: 'Xmlmessage',
        tagMapping: 'Level',
        whereArray: [
          [
            {'name': 'Category', 'op': 'EQUAL', 'value': 'contrail-discovery'},
            {'name': 'Level', 'op': 'EQUAL', 'value': '6'}
          ],
          [
            {'name': 'Category', 'op': 'EQUAL', 'value': 'contrail-analytics-api'},
            {'name': 'Level', 'op': 'IN_RANGE', 'value': '1', 'value2': '5'}
          ]
        ],
        filterArray: [
          {'name': 'Source', 'op': 'EQUAL', 'value': 'some', 'value2': 'error'},
          {'name': 'Category', 'op': 'IN_RANGE', 'value': 'no', 'value2': 'yup'}
        ]

      },
      range: {
        from: { _d: 132442},
        to: { _d: 342345}
      }
    };
    // done();
    let expectedFilter = [
      {'name': 'Source', 'op': 1, 'value': 'some', 'value2': 'error'},
      {'name': 'Category', 'op': 3, 'value': 'no', 'value2': 'yup'}
    ];
    let expectedWhere = [
      [
        {'name': 'Category', 'op': 1, 'value': 'contrail-discovery', 'value2': undefined},
        {'name': 'Level', 'op': 1, 'value': '6', 'value2': undefined}
      ],
      [
        {'name': 'Category', 'op': 1, 'value': 'contrail-analytics-api', 'value2': undefined},
        {'name': 'Level', 'op': 3, 'value': '1', 'value2': '5'}
      ]
    ];
    let analyticsQuerySpy = sinon.spy(ctx.ds, 'analyticsQuery');
    let datasourceOutput = ctx.$q.when({
      status: 200,
      data: {
        value: [
          {
            'Category': '__default__',
            'Level': 6,
            'MessageTS': 1495035030607132,
            'Messagetype': 'discServiceLog',
            'ModuleId': 'contrail-discovery',
            'SequenceNum': 1511639,
            'Source': 'choc-esxi6-a-vm4',
            'Type': 1,
            'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-topology,st=Collector&gt;  subs service=choc-esxi6-a-vm4, assign=2, count=2</log_msg></discServiceLog>'
          },
          {
            'Category': '__default__',
            'Level': 6,
            'MessageTS': 1495035031416257,
            'Messagetype': 'discServiceLog',
            'ModuleId': 'contrail-discovery',
            'SequenceNum': 1511640,
            'Source': 'choc-esxi6-a-vm4',
            'Type': 1,
            'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-vrouter-nodemgr,st=Collector&gt; del sid choc-esxi6-a-vm4, policy=chash, expired=True</log_msg></discServiceLog>'
          },
          {
            'Category': '__default__',
            'Level': 6,
            'MessageTS': 1495035031418099,
            'Messagetype': 'discServiceLog',
            'ModuleId': 'contrail-discovery',
            'SequenceNum': 1511641,
            'Source': 'choc-esxi6-a-vm4',
            'Type': 1,
            'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-vrouter-nodemgr,st=Collector&gt;  subs service=choc-esxi6-a-vm4, assign=2, count=2</log_msg></discServiceLog>'
          },
          {
            'Category': '__default__',
            'Level': 6,
            'MessageTS': 1495035031737203,
            'Messagetype': 'discServiceLog',
            'ModuleId': 'contrail-discovery',
            'SequenceNum': 1511642,
            'Source': 'choc-esxi6-a-vm4',
            'Type': 1,
            'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-snmp-collector,st=ApiServer&gt;  assign service=choc-esxi6-a-vm4, info={\'port\': \'9100\', \'ip-address\': \'10.209.1.13\'}</log_msg></discServiceLog>'
          }
        ]
      }
    });
    let datasourceRequestMock = sinon.stub();
    datasourceRequestMock.returns(datasourceOutput);
    ctx.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.ds.annotationQuery(input).then((res) => {
      expect(analyticsQuerySpy.getCall(0).args[0].data.filter).to.deep.equal(expectedFilter);
      expect(analyticsQuerySpy.getCall(0).args[0].data.where).to.deep.equal(expectedWhere);
      expect(datasourceRequestMock.calledTwice).to.be.true;
      expect(datasourceRequestMock.getCall(1).args[0].method).to.equal('POST');
      expect(datasourceRequestMock.getCall(1).args[0].url).to.equal('customCANurl/analytics/query');
      done();
    });
  });

  it('[setAuthToken] should set and return auth token', function (done) {
    let datasourceRequestMock = sinon.stub();
    let retObj = ctx.$q.when({
      status: 200,
      data: {
        'access': {'token': {'id': 'id1', 'expires': '2017-05-13T17:52:22Z'}}
      }
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.ds.keystoneUrl = 'keystoneUrl';
    ctx.ds.canUsername = 'admin';
    ctx.ds.canPassword = 'admin';
    ctx.ds.canTenant = 'canTenant';
    let authDict = {
      auth: {passwordCredentials: {username: 'admin',
        password: 'admin'},
        tenantName: 'canTenant'}
    };
    ctx.ds.setAuthToken().then((result) => {
      expect(result.token).to.be.equal('id1');
      expect(ctx.ds.authToken).to.be.equal('id1');
      expect(ctx.ds.authTokenExpire).to.be.equal(1494697942000);
      expect(datasourceRequestMock.calledOnce).to.be.true;
      expect(datasourceRequestMock.getCall(0).args[0].method).to.be.equal('POST');
      expect(datasourceRequestMock.getCall(0).args[0].url).to.be.equal('keystoneUrl');
      expect(datasourceRequestMock.getCall(0).args[0].data).to.deep.equal(authDict);
      done();
    });
  });

  it('[setAuthToken] should set token null when wrong credentials', function (done) {
    let datasourceRequestMock = sinon.stub();
    let retObj = ctx.$q.when({
      status: 500,
      data: null
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.ds.keystoneUrl = 'keystoneUrl';
    ctx.ds.canUsername = 'admin';
    ctx.ds.canPassword = 'admin';
    let authDict = {
      auth: {passwordCredentials: {username: 'admin',
        password: 'admin'},
        tenantName: 'admin'}
    };
    ctx.ds.setAuthToken().then((result) => {
      expect(result.token).to.be.equal(null);
      expect(ctx.ds.authToken).to.be.equal(null);
      expect(ctx.ds.authTokenExpire).to.be.equal(null);
      expect(datasourceRequestMock.calledOnce).to.be.true;
      expect(datasourceRequestMock.getCall(0).args[0].method).to.be.equal('POST');
      expect(datasourceRequestMock.getCall(0).args[0].url).to.be.equal('keystoneUrl');
      expect(datasourceRequestMock.getCall(0).args[0].data).to.deep.equal(authDict);
      done();
    });
  });

  it('[setAuthToken] should renew token on forceRenew', function (done) {
    let datasourceRequestMock = sinon.stub();
    let retObj = ctx.$q.when({
      status: 200,
      data: {
        'access': {'token': {'id': 'token2', 'expires': '2017-05-13T17:52:22Z'}}
      }
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.ds.keystoneUrl = 'keystoneUrl';
    ctx.ds.canUsername = 'admin';
    ctx.ds.canPassword = 'admin';
    let authDict = {
      auth: {passwordCredentials: {username: 'admin',
        password: 'admin'},
        tenantName: 'admin'}
    };
    ctx.ds.authToken = 'token1';
    ctx.ds.setAuthToken(true).then((result) => {
      expect(result.token).to.be.equal('token2');
      expect(ctx.ds.authToken).to.be.equal('token2');
      expect(ctx.ds.authTokenExpire).to.be.equal(1494697942000);
      expect(datasourceRequestMock.calledOnce).to.be.true;
      expect(datasourceRequestMock.getCall(0).args[0].method).to.be.equal('POST');
      expect(datasourceRequestMock.getCall(0).args[0].url).to.be.equal('keystoneUrl');
      expect(datasourceRequestMock.getCall(0).args[0].data).to.deep.equal(authDict);
      done();
    });
  });

  it('[setAuthToken] should reuse the cached token', function (done) {
    let datasourceRequestMock = sinon.spy();
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.ds.authToken = 'token1';
    ctx.ds.authTokenExpire = 3000;
    let dateMock = sinon.stub(Date, 'now');
    dateMock.returns(2000);
    ctx.ds.setAuthToken().then((result) => {
      expect(result.token).to.be.equal('token1');
      expect(ctx.ds.authToken).to.be.equal('token1');
      expect(ctx.ds.authTokenExpire).to.be.equal(3000);
      expect(datasourceRequestMock.calledOnce).to.be.false;
      done();
    });
  });

  it('[metricFindQuery] should return the metric(table names) results', function (done) {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        data: {
          value: [{'fields.value': 'Table1'},
                  {'fields.value': 'Table2'}
          ]
        }
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.metricFindQuery({target: null}).then(function (result) {
      expect(result).to.have.length(2);
      expect(result[0].text).to.equal('Table1');
      expect(result[0].value).to.equal(0);
      expect(result[1].text).to.equal('Table2');
      expect(result[1].value).to.equal(1);
      // done();
    });

    ctx.ds.metricFindQuery({target: 'random_metric'}).then(function (result) {
      expect(result).to.have.length(2);
      expect(result[0].text).to.equal('Table1');
      expect(result[0].value).to.equal(0);
      expect(result[1].text).to.equal('Table2');
      expect(result[1].value).to.equal(1);
      // done();
    });

    ctx.ds.metricFindQuery({}).then(function (result) {
      expect(result).to.have.length(2);
      expect(result[0].text).to.equal('Table1');
      expect(result[0].value).to.equal(0);
      expect(result[1].text).to.equal('Table2');
      expect(result[1].value).to.equal(1);
      done();
    });
  });

  it('[metricFindQuery] should throw error when args are undefined', function (done) {
    global.assert.throw(function () { ctx.ds.metricFindQuery(); }, Error, "Cannot read property 'start' of undefined");
    done();
  });

  it('[metricFindQuery] should throw error when args are null', function (done) {
    global.assert.throw(function () { ctx.ds.metricFindQuery(null); }, Error, "Cannot read property 'start' of null");
    done();
  });

  it('[mapToTextValue] should return data as text and as value', function (done) {
    let result = ctx.ds.mapToTextValue({data: {value: [{'fields.value': 'zero'},
                                                       {'fields.value': 'one'},
                                                       {'fields.value': 'two'}]}});

    expect(result).to.have.length(3);
    expect(result[0].text).to.equal('zero');
    expect(result[0].value).to.equal(0);
    expect(result[1].text).to.equal('one');
    expect(result[1].value).to.equal(1);
    expect(result[2].text).to.equal('two');
    expect(result[2].value).to.equal(2);
    done();
  });

  it('[analyticsQuery] should handle GET method', function (done) {
    global.assert.throw(function () { ctx.ds.analyticsQuery(null); }, Error, "Cannot read property 'url' of null");
    let datasourceRequestMock = sinon.stub();
    let retObj = ctx.$q.when({
      target: 'X',
      data: {
        value: [{
          T: '140000000',
          val: '1234'
        },
        {
          T: '140000001',
          val: '1235'
        }
        ]
      },
      config: {data: {select_fields: ['T', 'table_name']}}
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    // datasourceRequestMock.expects('datasourceRequest').twice().returns(retObj);
    const paramObj = {
      'url': 'hello',
      'method': 'GET',
    };
    ctx.ds.analyticsQuery(paramObj).then((result) => {
      expect(datasourceRequestMock.calledTwice).to.be.true;
      // first call is for token request
      expect(datasourceRequestMock.getCall(1).args[0].url).to.equal('hello');
      expect(datasourceRequestMock.getCall(1).args[0].method).to.equal('GET');
      done();
    });
  });

  it('[analyticsQuery] should handle POST method: default data', function (done) {
    let datasourceRequestMock = sinon.stub();
    let dataObj = {
      value: [{
        T: '140000000',
        val: '1234'
      },
      {
        T: '140000001',
        val: '1235'
      }
      ]
    };
    let retObj = ctx.$q.when({
      target: 'X',
      data: dataObj,
      config: {data: {select_fields: ['T', 'table_name']}}
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    // datasourceRequestMock.expects('datasourceRequest').twice().returns(retObj);
    const paramObj = {
      'url': 'hello_post'
    };
    ctx.ds.analyticsQuery(paramObj).then((result) => {
      expect(result.data).to.deep.equal(dataObj);
      expect(datasourceRequestMock.calledTwice).to.be.true;
      // first call is for token request
      expect(datasourceRequestMock.getCall(1).args[0].url).to.equal('hello_post');
      expect(datasourceRequestMock.getCall(1).args[0].method).to.equal('POST');
      expect(datasourceRequestMock.getCall(1).args[0].data.end_time).to.equal('now');
      expect(datasourceRequestMock.getCall(1).args[0].data.start_time).to.equal('now-10m');
      expect(datasourceRequestMock.getCall(1).args[0].data.select_fields).to.deep.equal(['name', 'fields.value']);
      expect(datasourceRequestMock.getCall(1).args[0].data.table).to.equal('StatTable.FieldNames.fields');
      expect(datasourceRequestMock.getCall(1).args[0].data.where).to.deep.equal([[{'name': 'name', 'value': 'STAT', 'op': 7}]]);

      done();
    });
  });

  it('[analyticsQuery] should handle POST method: custom data', function (done) {
    let datasourceRequestMock = sinon.stub();
    let dataObj = {
      value: [{
        T: '140000000',
        val: '1234'
      },
      {
        T: '140000001',
        val: '1235'
      }
      ]
    };
    let retObj = ctx.$q.when({
      target: 'X',
      data: dataObj,
      config: {data: {select_fields: ['T', 'table_name']}}
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    // datasourceRequestMock.expects('datasourceRequest').twice().returns(retObj);
    const paramObj = {
      'url': 'hello_post_custom'
    };
    paramObj.data = {
      'end': '1 year',
      'start': '0 year',
      'select_fields': ['some_val'],
      'table': 'thattable',
      'filter': '#nofilter'
    };
    ctx.ds.analyticsQuery(paramObj).then((result) => {
      expect(result.data).to.deep.equal(dataObj);
      expect(datasourceRequestMock.calledTwice).to.be.true;
      // first call is for token request
      expect(datasourceRequestMock.getCall(1).args[0].url).to.equal('hello_post_custom');
      expect(datasourceRequestMock.getCall(1).args[0].method).to.equal('POST');
      expect(datasourceRequestMock.getCall(1).args[0].data).to.deep.equal(paramObj.data);

      done();
    });
  });

  it('[getColumns] should return columns', function (done) {
    let datasourceRequestMock = sinon.stub();
    let dataObj = {
      'type': 'STAT',
      'columns': [
        {'datatype': 'string', 'index': true, 'name': 'Source', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'T', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'CLASS(T)', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'T=', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'CLASS(T=)', 'suffixes': null},
        {'datatype': 'uuid', 'index': false, 'name': 'UUID', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'COUNT(counters)', 'suffixes': null}
      ]
    };
    let filteredRes = [
      {'text': 'COUNT(counters)', 'type': 'int', 'value': 0, 'index': false}
    ];
    let unfilteredRes = [
      {'type': 'string', 'index': true, 'text': 'Source', 'value': 0},
      {'type': 'int', 'index': false, 'text': 'T', 'value': 1},
      {'type': 'int', 'index': false, 'text': 'CLASS(T)', 'value': 2},
      {'type': 'int', 'index': false, 'text': 'T=', 'value': 3},
      {'type': 'int', 'index': false, 'text': 'CLASS(T=)', 'value': 4},
      {'type': 'uuid', 'index': false, 'text': 'UUID', 'value': 5},
      {'type': 'int', 'index': false, 'text': 'COUNT(counters)', 'value': 6}
    ];
    let retObj = ctx.$q.when({
      target: 'X',
      data: dataObj,
      config: {data: {select_fields: ['T', 'table_name']}}
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.ds.url = 'myurl';
    const tableName = 'myTable';
    ctx.ds.getColumns(tableName).then((result) => {
      expect(result.filtered).to.deep.equal(filteredRes);
      expect(result.unfiltered).to.deep.equal(unfilteredRes);
      expect(datasourceRequestMock.calledTwice).to.be.true;
      expect(datasourceRequestMock.getCall(1).args[0].url).to.equal(
                                                          'myurl/analytics/table/'
                                                          + tableName +
                                                          '/schema');
      expect(datasourceRequestMock.getCall(1).args[0].method).to.equal('GET');
      done();
    });
  });

  it('[mapToValue] should return filtered and unfiltered columns', function (done) {
    global.assert.throw(function () { ctx.ds.mapToValue(null); }, Error, "Cannot read property 'data' of null");
    global.assert.throw(function () { ctx.ds.mapToValue(undefined); }, Error, "Cannot read property 'data' of undefined");
    let dataObj = {
      'type': 'STAT',
      'columns': [
        {'datatype': 'StRiNg', 'index': true, 'name': 'Source', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 't', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'CLASS(T)', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'T=', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'CLASS(T=)', 'suffixes': null},
        {'datatype': 'UUID', 'index': false, 'name': 'UUID', 'suffixes': null},
        {'datatype': 'INT', 'index': false, 'name': 'COUNT(counters)', 'suffixes': null}
      ]
    };
    let filteredRes = [
      {'text': 'COUNT(counters)', 'type': 'INT', 'value': 0, 'index': false}
    ];
    let unfilteredRes = [
      {'type': 'StRiNg', 'index': true, 'text': 'Source', 'value': 0},
      {'type': 'int', 'index': false, 'text': 't', 'value': 1},
      {'type': 'int', 'index': false, 'text': 'CLASS(T)', 'value': 2},
      {'type': 'int', 'index': false, 'text': 'T=', 'value': 3},
      {'type': 'int', 'index': false, 'text': 'CLASS(T=)', 'value': 4},
      {'type': 'UUID', 'index': false, 'text': 'UUID', 'value': 5},
      {'type': 'INT', 'index': false, 'text': 'COUNT(counters)', 'value': 6}
    ];
    let retObj = {data: dataObj};
    let result = ctx.ds.mapToValue(retObj);
    expect(result.filtered).to.deep.equal(filteredRes);
    expect(result.unfiltered).to.deep.equal(unfilteredRes);
    done();
  });

  it('[buildQueryParameters] should return valid query object', function (done) {
    let options = {
      'intervalMs': 15000,
      'targets': [
        {'hide': false, 'table': 'Select Table', 'selCol': 'someCol'},
        {'hide': false, 'table': 'Some table'},
        {'hide': false, 'selCol': 'someCol'},
        {'hide': true, 'table': 'someTable', 'selCol': 'someCol'},
        {'hide': false, 'table': 'someTable', 'selCol': 'someCol', 'advanced': false},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': false,
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000},
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': false,
          'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000},
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'AVG(someCol)',
          'advanced': false,
          'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000},
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'AVG(someCol)',
          'advanced': true,
          'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000},
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]}
      ],
      'range': {'to': 'f', 'from': 'f'}
    };
    ctx.templateSrv.replace = function (data) {
      return data;
    };
    let result = ctx.ds.buildQueryParameters(options);
    let expectedRes = [
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T', 'someCol'], 'where': [[{'name': 'name', 'value': '', 'op': 7}]], 'limit': 1000},
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T', 'someCol'], 'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'op': 6, 'value': '6000000', 'value2': undefined}]], 'limit': 1000},
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T', 'someCol'], 'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'op': 6, 'value': '6000000', 'value2': undefined}, {'name': 'process_mem_cpu_usage.cpu_share', 'op': 5, 'value': '10000000', 'value2': undefined}], [{'name': 'process_mem_cpu_usage.__key', 'op': 6, 'value': '67', 'value2': undefined}]], 'limit': 1000},
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T', 'someCol'], 'where': [[{'name': 'name', 'value': '', 'op': 7}]], 'limit': 1000},
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T', 'someCol'], 'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'op': 6, 'value': '6000000', 'value2': undefined}, {'name': 'process_mem_cpu_usage.cpu_share', 'op': 5, 'value': '10000000', 'value2': undefined}], [{'name': 'process_mem_cpu_usage.__key', 'op': 6, 'value': '67', 'value2': undefined}]], 'limit': 1000, 'filter': [{'name': 'someCol', 'value': 9000000, 'op': 3, 'value2': 6000000}]},
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T', 'someCol'], 'where': [[{'name': 'name', 'value': '', 'op': 7}]], 'limit': 1000},
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T=15', 'AVG(someCol)'], 'where': [[{'name': 'name', 'value': '', 'op': 7}]], 'limit': 1000},
      {'table': 'someTable', 'start_time': NaN, 'end_time': NaN, 'select_fields': ['T=15', 'AVG(someCol)'], 'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'op': 6, 'value': '6000000', 'value2': undefined}, {'name': 'process_mem_cpu_usage.cpu_share', 'op': 5, 'value': '10000000', 'value2': undefined}], [{'name': 'process_mem_cpu_usage.__key', 'op': 6, 'value': '67', 'value2': undefined}]], 'limit': 1000}
    ];
    expect(result).to.have.length(8);
    expect(result).to.deep.equal(expectedRes);
    done();
  });
});
